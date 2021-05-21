import { IndexingPolicy } from "@azure/cosmos"
import * as T from "@effect-ts/core/Effect"
import * as O from "@effect-ts/core/Option"
import * as EO from "@effect-ts-app/core/ext/EffectOption"
import { constVoid, pipe } from "@effect-ts-app/core/ext/Function"
import { typedKeysOf } from "@effect-ts-app/core/ext/utils"

import * as Cosmos from "../cosmos-client"
import { CachedRecord, DBRecord, OptimisticLockException } from "./shared"
import * as simpledb from "./simpledb"
import { Version } from "./simpledb"

class CosmosDbOperationError {
  constructor(readonly message: string) {}
}

const setup = (type: string, indexingPolicy: IndexingPolicy) =>
  pipe(
    Cosmos.db,
    T.tap((db) =>
      T.tryPromise(() =>
        db.containers
          .create({ id: type, indexingPolicy })
          .catch((err) => console.warn(err))
      )
    )
    // TODO: Error if current indexingPolicy does not match
    //T.chain((db) => T.tryPromise(() => db.container(type).(indexes)))
  )

export function createContext<TKey extends string, EA, A extends DBRecord<TKey>>() {
  return <REncode, RDecode, EDecode>(
    type: string,
    encode: (record: A) => T.RIO<REncode, EA>,
    decode: (d: EA) => T.Effect<RDecode, EDecode, A>,
    //schemaVersion: string,
    indexes: IndexingPolicy
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
        Cosmos.db,
        T.chain((db) =>
          T.tryPromise(() => db.container(type).item(id).read<{ data: EA }>())
        ),
        T.map((i) => O.fromNullable(i.resource)),
        EO.map(({ _etag, data }) => ({ version: _etag, data } as CachedRecord<EA>))
      )
    }

    function findBy(parameters: Record<string, string>) {
      return pipe(
        Cosmos.db,
        T.chain((db) =>
          T.tryPromise(() =>
            db
              .container(type)
              .items.query({
                query: `SELECT id from c as i WHERE ${typedKeysOf(parameters)
                  .map((k) => `i.${k} = @${k}`)
                  .join(" AND ")}`,
                parameters: typedKeysOf(parameters).map((p) => ({
                  name: p,
                  value: parameters[p],
                })),
              })
              .fetchAll()
          )
        ),
        T.map((x) => O.fromNullable(x.resources[0])),
        EO.map(({ id }) => id)
      )
    }

    function store(record: A, currentVersion: Version) {
      const isNew = currentVersion === ""
      const version = "_etag" // we get this from the etag anyway.
      return pipe(
        Cosmos.db,
        T.chain((db) =>
          pipe(
            encode(record),
            T.chain((data) =>
              T.tryPromise(() =>
                isNew
                  ? db
                      .container(type)
                      .items.create({
                        id: record.id,
                        version,
                        timestamp: new Date(),
                        data,
                      })
                      .then(constVoid)
                  : db
                      .container(type)

                      .item(record.id)
                      .replace(
                        {
                          id: record.id,
                          version,
                          timestamp: new Date(),
                          data,
                        },
                        {
                          accessCondition: {
                            type: "IfMatch",
                            condition: currentVersion,
                          },
                        }
                      )
                      .then((x) => {
                        if (x.statusCode === 412) {
                          throw new OptimisticLockException(type, record.id)
                        }
                        if (x.statusCode > 299 || x.statusCode < 200) {
                          throw new CosmosDbOperationError("not able to update record")
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
