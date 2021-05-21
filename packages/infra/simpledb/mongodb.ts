import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { constVoid, pipe } from "@effect-ts-app/core/ext/Function"
import { CollectionInsertOneOptions, IndexSpecification } from "mongodb"

import * as Mongo from "../mongo-client"
import { CachedRecord, DBRecord, OptimisticLockException } from "./shared"
import * as simpledb from "./simpledb"
import { Version } from "./simpledb"

// const makeFromIndexKeys = (indexKeys: string[], unique: boolean) => indexKeys.reduce((prev, cur) => {
//   prev[cur] = 1
//   return prev
// }, {} as Record<string, number>)

const setup = (type: string, indexes: IndexSpecification[]) =>
  pipe(
    Mongo.db,
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
        Mongo.db,
        T.chain((db) =>
          T.tryPromise(() =>
            db
              .collection(type)
              .findOne<{ _id: TKey; version: Version; data: EA }>({ _id: id })
          )
        ),
        T.map(O.fromNullable),
        EO.map(({ data, version }) => ({ version, data } as CachedRecord<EA>))
      )
    }

    function findBy(keys: Record<string, string>) {
      return pipe(
        Mongo.db,
        T.chain((db) =>
          T.tryPromise(() =>
            db.collection(type).findOne<{ _id: TKey }>(keys, { projection: { _id: 1 } })
          )
        ),
        T.map(O.fromNullable),
        EO.map(({ _id }) => _id)
      )
    }

    function store(record: A, currentVersion: Version) {
      const isNew = currentVersion === ""
      const version = isNew ? "1" : (parseInt(currentVersion) + 1).toString()
      return pipe(
        Mongo.db,
        T.chain((db) =>
          pipe(
            encode(record),
            T.chain((data) =>
              T.tryPromise(() =>
                isNew
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
                        { _id: record.id, version: currentVersion },
                        {
                          $set: {
                            version,
                            timestamp: new Date(),
                            data,
                          },
                        },
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
