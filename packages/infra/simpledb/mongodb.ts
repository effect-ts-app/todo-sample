import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { constVoid, pipe } from "@effect-ts-app/core/ext/Function"
import * as T from "@effect-ts/core/Effect"
import * as L from "@effect-ts/core/Effect/Layer"
import * as M from "@effect-ts/core/Effect/Managed"
import * as Has from "@effect-ts/core/Has"
import * as O from "@effect-ts/core/Option"
import { _A } from "@effect-ts/core/Utils"
import { MongoClient, IndexSpecification, CollectionInsertOneOptions } from "mongodb"

import { DBRecord, CachedRecord, OptimisticLockException } from "./shared"
import * as simpledb from "./simpledb"

// TODO: we should probably share a single client...

const withClient = (url: string) =>
  M.make_(
    T.effectAsync<unknown, Error, MongoClient>((res) => {
      const client = new MongoClient(url)
      client.connect((err, cl) => {
        err ? res(T.fail(err)) : res(T.succeed(cl))
      })
    }),
    (cl) =>
      pipe(
        T.uninterruptible(
          T.effectAsync<unknown, Error, void>((res) => {
            cl.close((err, r) => res(err ? T.fail(err) : T.succeed(r)))
          })
        ),
        T.orDie
      )
  )

const makeMongoClientEnv = (url: string, dbName?: string) =>
  pipe(
    withClient(url),
    M.map((x) => ({ db: x.db(dbName) }))
  )

export interface MongoClientEnv extends _A<ReturnType<typeof makeMongoClientEnv>> {}

export const MongoClientEnv = Has.tag<MongoClientEnv>()

export const { db } = T.deriveLifted(MongoClientEnv)([], [], ["db"])

export const MongoClientEnvLive = (redisUrl: string, dbName?: string) =>
  L.fromManaged(MongoClientEnv)(makeMongoClientEnv(redisUrl, dbName))

// const makeFromIndexKeys = (indexKeys: string[], unique: boolean) => indexKeys.reduce((prev, cur) => {
//   prev[cur] = 1
//   return prev
// }, {} as Record<string, number>)

const setup = (type: string, indexes: IndexSpecification[]) =>
  pipe(
    db,
    T.tap((db) =>
      T.tryPromise(() => db.createCollection(type).catch((err) => console.warn(err)))
    ),
    T.chain((db) => T.tryPromise(() => db.collection(type).createIndexes(indexes)))
  )

export function createContext<TKey extends string, EA, A extends DBRecord<TKey>>() {
  return <REncode, RDecode, EDecode>(
    type: string,
    encode: (record: A) => T.RIO<REncode, EA>,
    decode: (d: EA) => T.Effect<RDecode, EDecode, A>,
    //schemaVersion: string,
    indexes: IndexSpecification[]
  ) => {
    return pipe(
      setup(type, indexes),
      T.map(() => ({
        find: simpledb.find(find, decode, type),
        findBy,
        save: simpledb.storeDirectly(store, type),
      }))
    )

    function find(id: string) {
      return pipe(
        db,
        T.chain((db) =>
          T.tryPromise(() =>
            db
              .collection(type)
              .findOne<{ _id: TKey; version: number; data: EA }>({ _id: id })
          )
        ),
        T.map(O.fromNullable),
        EO.map(({ data, version }) => ({ version, data } as CachedRecord<EA>))
      )
    }

    function findBy(keys: Record<string, string>) {
      return pipe(
        db,
        T.chain((db) =>
          T.tryPromise(() =>
            db.collection(type).findOne<{ _id: TKey }>(keys, { projection: { _id: 1 } })
          )
        ),
        T.map(O.fromNullable),
        EO.map(({ _id }) => _id)
      )
    }

    function store(record: A, version: number) {
      return pipe(
        db,
        T.chain((db) =>
          pipe(
            encode(record),
            T.chain((data) =>
              T.tryPromise(() =>
                version == 1
                  ? db
                      .collection(type)
                      .insertOne(
                        { _id: record.id, version, timestamp: new Date(), data },
                        {
                          checkKeys: false, // support for keys with `.` and `$`. NOTE: you can write them, read them, but NOT query for them.
                        } as CollectionInsertOneOptions
                      )
                      .then(constVoid)
                  : db
                      .collection(type)
                      .findOneAndUpdate(
                        { _id: record.id, version: version - 1 },
                        { $set: { version, timestamp: new Date(), data } },
                        { upsert: false }
                      )
                      .then((x) => {
                        if (!x.ok) {
                          throw new OptimisticLockException(type, record.id)
                        }
                      })
                      .then(constVoid)
              )
            )
          )
        ),
        T.orDie,
        T.map(() => ({ version, data: record } as CachedRecord<A>))
      )
    }
  }
}
