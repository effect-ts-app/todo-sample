import * as EO from "@effect-ts-demo/core/ext/EffectOption"
import { flow, pipe } from "@effect-ts-demo/core/ext/Function"
import * as MO from "@effect-ts-demo/core/ext/Model"
import * as T from "@effect-ts/core/Effect"
import * as M from "@effect-ts/core/Effect/Managed"
import * as O from "@effect-ts/core/Option"
import * as Sy from "@effect-ts/core/Sync"

import * as RED from "../redis"

import {
  SerializedDBRecord,
  DBRecord,
  CachedRecord,
  getRecordName,
  CouldNotAquireDbLockException,
  ConnectionException,
  Index,
  getIndexName,
} from "./shared"
import * as simpledb from "./simpledb"

const ttl = 10 * 1000

export function createContext<TKey extends string, EA, A extends DBRecord<TKey>>() {
  return <REncode, RDecode, EDecode>(
    type: string,
    encode: (record: A) => T.RIO<REncode, EA>,
    decode: (d: EA) => T.Effect<RDecode, EDecode, A>,
    schemaVersion: string,
    makeIndexKey: (r: A) => Index
  ) => {
    const getData = flow(encode, T.map(JSON.stringify))
    return {
      find: simpledb.find(find, decode, type),
      findByIndex: getIdx,
      save: simpledb.store(find, store, lockRedisRecord, type),
    }

    function find(id: string) {
      return pipe(
        RED.hmgetAll(getKey(id)),
        EO.chainEffect((v) =>
          pipe(
            SerializedDBRecord.decode_({
              ...v,
              version: parseInt(v.version),
            }),
            Sy.map(({ data, version }) => ({ data: JSON.parse(data) as EA, version })),
            Sy.mapError((e) => new ConnectionException(new Error(MO.printErrors(e))))
          )
        ),
        T.orDie
      )
    }

    function store(record: A, version: number) {
      return version === 1
        ? pipe(
            M.use_(lockIndex(record), () =>
              pipe(
                pipe(
                  getIndex(record),
                  EO.zipRight(
                    T.fail(() => new Error("Combination already exists, abort"))
                  )
                ),
                T.zipRight(getData(record)),
                // TODO: instead use MULTI & EXEC to make it in one command?
                T.chain((data) =>
                  hmSetRec(getKey(record.id), {
                    version,
                    timestamp: O.some(new Date()),
                    data,
                  })
                ),
                T.zipRight(setIndex(record)),
                T.orDie
              )
            ),
            T.map(() => ({ version, data: record } as CachedRecord<A>))
          )
        : pipe(
            pipe(
              getData(record),
              T.chain((data) =>
                hmSetRec(getKey(record.id), {
                  version,
                  timestamp: O.some(new Date()),
                  data,
                })
              ),
              T.orDie
            ),
            T.map(() => ({ version, data: record } as CachedRecord<A>))
          )
    }

    function getIndex(record: A) {
      const index = makeIndexKey(record)
      return getIdx(index)
    }

    function setIndex(record: A) {
      const index = makeIndexKey(record)
      return setIdx(index, record)
    }

    function lockIndex(record: A) {
      const index = makeIndexKey(record)
      return lockRedisIdx(index)
    }

    function getIdx(index: Index) {
      return pipe(
        RED.hget(getIdxKey(index), index.key),
        EO.map((i) => i as TKey)
      )
    }

    function setIdx(index: Index, r: A) {
      return RED.hset(getIdxKey(index), index.key, r.id)
    }

    function lockRedisIdx(index: Index) {
      const lockKey = getIdxLockKey(index)
      return M.make_(
        T.bimap_(
          // acquire
          T.chain_(RED.lock, (lock) => T.tryPromise(() => lock.lock(lockKey, ttl))),
          (err) => new CouldNotAquireDbLockException(type, lockKey, err as Error),
          // release
          (lock) => ({ release: T.tryPromise(() => lock.unlock())["|>"](T.orDie) })
        ),
        (l) => l.release
      )
    }

    function lockRedisRecord(id: string) {
      return M.make_(
        T.bimap_(
          // acquire
          T.chain_(RED.lock, (lock) =>
            T.tryPromise(() => lock.lock(getLockKey(id), ttl))
          ),
          (err) => new CouldNotAquireDbLockException(type, id, err as Error),
          // release
          (lock) => ({ release: T.tryPromise(() => lock.unlock())["|>"](T.orDie) })
        ),
        (l) => l.release
      )
    }

    function getKey(id: string) {
      return `v${schemaVersion}.${getRecordName(type, id)}`
    }

    function getLockKey(id: string) {
      return `v${schemaVersion}.locks.${getRecordName(type, id)}`
    }

    function getIdxKey(index: Index) {
      return `v${schemaVersion}.${getIndexName(type, index.doc)}`
    }
    function getIdxLockKey(index: Index) {
      return `v${schemaVersion}.locks.${getIndexName(type, index.doc)}_${index.key}`
    }
  }

  function hmSetRec(key: string, val: SerializedDBRecord) {
    return T.chain_(RED.client, (client) =>
      T.uninterruptible(
        T.effectAsync<unknown, ConnectionException, void>((res) => {
          client.hmset(
            key,
            "version",
            val.version,
            "timestamp",
            pipe(
              val.timestamp,
              O.getOrElse(() => new Date()),
              (x) => x.toISOString()
            ),
            "data",
            val.data,
            (err) =>
              err ? res(T.fail(new ConnectionException(err))) : res(T.succeed(void 0))
          )
        })
      )
    )
  }
}
