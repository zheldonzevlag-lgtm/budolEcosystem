
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model EcosystemApp
 * 
 */
export type EcosystemApp = $Result.DefaultSelection<Prisma.$EcosystemAppPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MERCHANT: 'MERCHANT',
  DRIVER: 'DRIVER',
  STAFF: 'STAFF',
  DEACTIVATED: 'DEACTIVATED'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const KYCStatus: {
  NONE: 'NONE',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
};

export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus]


export const KYCTier: {
  BASIC: 'BASIC',
  SEMI_VERIFIED: 'SEMI_VERIFIED',
  FULLY_VERIFIED: 'FULLY_VERIFIED'
};

export type KYCTier = (typeof KYCTier)[keyof typeof KYCTier]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type KYCStatus = $Enums.KYCStatus

export const KYCStatus: typeof $Enums.KYCStatus

export type KYCTier = $Enums.KYCTier

export const KYCTier: typeof $Enums.KYCTier

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs>;

  /**
   * `prisma.ecosystemApp`: Exposes CRUD operations for the **EcosystemApp** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EcosystemApps
    * const ecosystemApps = await prisma.ecosystemApp.findMany()
    * ```
    */
  get ecosystemApp(): Prisma.EcosystemAppDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Session: 'Session',
    EcosystemApp: 'EcosystemApp'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "user" | "session" | "ecosystemApp"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      EcosystemApp: {
        payload: Prisma.$EcosystemAppPayload<ExtArgs>
        fields: Prisma.EcosystemAppFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EcosystemAppFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EcosystemAppFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          findFirst: {
            args: Prisma.EcosystemAppFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EcosystemAppFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          findMany: {
            args: Prisma.EcosystemAppFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>[]
          }
          create: {
            args: Prisma.EcosystemAppCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          createMany: {
            args: Prisma.EcosystemAppCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EcosystemAppCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>[]
          }
          delete: {
            args: Prisma.EcosystemAppDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          update: {
            args: Prisma.EcosystemAppUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          deleteMany: {
            args: Prisma.EcosystemAppDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EcosystemAppUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EcosystemAppUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EcosystemAppPayload>
          }
          aggregate: {
            args: Prisma.EcosystemAppAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEcosystemApp>
          }
          groupBy: {
            args: Prisma.EcosystemAppGroupByArgs<ExtArgs>
            result: $Utils.Optional<EcosystemAppGroupByOutputType>[]
          }
          count: {
            args: Prisma.EcosystemAppCountArgs<ExtArgs>
            result: $Utils.Optional<EcosystemAppCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    sessions: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }


  /**
   * Count Type EcosystemAppCountOutputType
   */

  export type EcosystemAppCountOutputType = {
    sessions: number
  }

  export type EcosystemAppCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | EcosystemAppCountOutputTypeCountSessionsArgs
  }

  // Custom InputTypes
  /**
   * EcosystemAppCountOutputType without action
   */
  export type EcosystemAppCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemAppCountOutputType
     */
    select?: EcosystemAppCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EcosystemAppCountOutputType without action
   */
  export type EcosystemAppCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    phoneNumber: string | null
    firstName: string | null
    lastName: string | null
    role: $Enums.UserRole | null
    department: string | null
    createdAt: Date | null
    updatedAt: Date | null
    isFaceVerified: boolean | null
    kycStatus: $Enums.KYCStatus | null
    kycTier: $Enums.KYCTier | null
    otpCode: string | null
    otpExpiresAt: Date | null
    otpUpdatedAt: Date | null
    emailVerified: boolean | null
    phoneVerified: boolean | null
    avatarUrl: string | null
    faceTemplate: string | null
    lastLoginAt: Date | null
    pinHash: string | null
    biometricKeyId: string | null
    biometricPublicKey: Buffer | null
    trustedDevices: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    phoneNumber: string | null
    firstName: string | null
    lastName: string | null
    role: $Enums.UserRole | null
    department: string | null
    createdAt: Date | null
    updatedAt: Date | null
    isFaceVerified: boolean | null
    kycStatus: $Enums.KYCStatus | null
    kycTier: $Enums.KYCTier | null
    otpCode: string | null
    otpExpiresAt: Date | null
    otpUpdatedAt: Date | null
    emailVerified: boolean | null
    phoneVerified: boolean | null
    avatarUrl: string | null
    faceTemplate: string | null
    lastLoginAt: Date | null
    pinHash: string | null
    biometricKeyId: string | null
    biometricPublicKey: Buffer | null
    trustedDevices: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    phoneNumber: number
    firstName: number
    lastName: number
    role: number
    department: number
    createdAt: number
    updatedAt: number
    isFaceVerified: number
    kycData: number
    kycStatus: number
    kycTier: number
    otpCode: number
    otpExpiresAt: number
    otpUpdatedAt: number
    emailVerified: number
    phoneVerified: number
    avatarUrl: number
    faceTemplate: number
    lastLoginAt: number
    pinHash: number
    biometricKeyId: number
    biometricPublicKey: number
    trustedDevices: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    phoneNumber?: true
    firstName?: true
    lastName?: true
    role?: true
    department?: true
    createdAt?: true
    updatedAt?: true
    isFaceVerified?: true
    kycStatus?: true
    kycTier?: true
    otpCode?: true
    otpExpiresAt?: true
    otpUpdatedAt?: true
    emailVerified?: true
    phoneVerified?: true
    avatarUrl?: true
    faceTemplate?: true
    lastLoginAt?: true
    pinHash?: true
    biometricKeyId?: true
    biometricPublicKey?: true
    trustedDevices?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    phoneNumber?: true
    firstName?: true
    lastName?: true
    role?: true
    department?: true
    createdAt?: true
    updatedAt?: true
    isFaceVerified?: true
    kycStatus?: true
    kycTier?: true
    otpCode?: true
    otpExpiresAt?: true
    otpUpdatedAt?: true
    emailVerified?: true
    phoneVerified?: true
    avatarUrl?: true
    faceTemplate?: true
    lastLoginAt?: true
    pinHash?: true
    biometricKeyId?: true
    biometricPublicKey?: true
    trustedDevices?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    phoneNumber?: true
    firstName?: true
    lastName?: true
    role?: true
    department?: true
    createdAt?: true
    updatedAt?: true
    isFaceVerified?: true
    kycData?: true
    kycStatus?: true
    kycTier?: true
    otpCode?: true
    otpExpiresAt?: true
    otpUpdatedAt?: true
    emailVerified?: true
    phoneVerified?: true
    avatarUrl?: true
    faceTemplate?: true
    lastLoginAt?: true
    pinHash?: true
    biometricKeyId?: true
    biometricPublicKey?: true
    trustedDevices?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName: string | null
    lastName: string | null
    role: $Enums.UserRole
    department: string | null
    createdAt: Date
    updatedAt: Date
    isFaceVerified: boolean
    kycData: JsonValue | null
    kycStatus: $Enums.KYCStatus
    kycTier: $Enums.KYCTier
    otpCode: string | null
    otpExpiresAt: Date | null
    otpUpdatedAt: Date | null
    emailVerified: boolean
    phoneVerified: boolean
    avatarUrl: string | null
    faceTemplate: string | null
    lastLoginAt: Date | null
    pinHash: string | null
    biometricKeyId: string | null
    biometricPublicKey: Buffer | null
    trustedDevices: string | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    phoneNumber?: boolean
    firstName?: boolean
    lastName?: boolean
    role?: boolean
    department?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isFaceVerified?: boolean
    kycData?: boolean
    kycStatus?: boolean
    kycTier?: boolean
    otpCode?: boolean
    otpExpiresAt?: boolean
    otpUpdatedAt?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: boolean
    faceTemplate?: boolean
    lastLoginAt?: boolean
    pinHash?: boolean
    biometricKeyId?: boolean
    biometricPublicKey?: boolean
    trustedDevices?: boolean
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    phoneNumber?: boolean
    firstName?: boolean
    lastName?: boolean
    role?: boolean
    department?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isFaceVerified?: boolean
    kycData?: boolean
    kycStatus?: boolean
    kycTier?: boolean
    otpCode?: boolean
    otpExpiresAt?: boolean
    otpUpdatedAt?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: boolean
    faceTemplate?: boolean
    lastLoginAt?: boolean
    pinHash?: boolean
    biometricKeyId?: boolean
    biometricPublicKey?: boolean
    trustedDevices?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    phoneNumber?: boolean
    firstName?: boolean
    lastName?: boolean
    role?: boolean
    department?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    isFaceVerified?: boolean
    kycData?: boolean
    kycStatus?: boolean
    kycTier?: boolean
    otpCode?: boolean
    otpExpiresAt?: boolean
    otpUpdatedAt?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: boolean
    faceTemplate?: boolean
    lastLoginAt?: boolean
    pinHash?: boolean
    biometricKeyId?: boolean
    biometricPublicKey?: boolean
    trustedDevices?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      sessions: Prisma.$SessionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string
      phoneNumber: string
      firstName: string | null
      lastName: string | null
      role: $Enums.UserRole
      department: string | null
      createdAt: Date
      updatedAt: Date
      isFaceVerified: boolean
      kycData: Prisma.JsonValue | null
      kycStatus: $Enums.KYCStatus
      kycTier: $Enums.KYCTier
      otpCode: string | null
      otpExpiresAt: Date | null
      otpUpdatedAt: Date | null
      emailVerified: boolean
      phoneVerified: boolean
      avatarUrl: string | null
      faceTemplate: string | null
      lastLoginAt: Date | null
      pinHash: string | null
      biometricKeyId: string | null
      biometricPublicKey: Buffer | null
      trustedDevices: string | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly phoneNumber: FieldRef<"User", 'String'>
    readonly firstName: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'UserRole'>
    readonly department: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly isFaceVerified: FieldRef<"User", 'Boolean'>
    readonly kycData: FieldRef<"User", 'Json'>
    readonly kycStatus: FieldRef<"User", 'KYCStatus'>
    readonly kycTier: FieldRef<"User", 'KYCTier'>
    readonly otpCode: FieldRef<"User", 'String'>
    readonly otpExpiresAt: FieldRef<"User", 'DateTime'>
    readonly otpUpdatedAt: FieldRef<"User", 'DateTime'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly phoneVerified: FieldRef<"User", 'Boolean'>
    readonly avatarUrl: FieldRef<"User", 'String'>
    readonly faceTemplate: FieldRef<"User", 'String'>
    readonly lastLoginAt: FieldRef<"User", 'DateTime'>
    readonly pinHash: FieldRef<"User", 'String'>
    readonly biometricKeyId: FieldRef<"User", 'String'>
    readonly biometricPublicKey: FieldRef<"User", 'Bytes'>
    readonly trustedDevices: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    appId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    appId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    userId: number
    appId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    userId?: true
    appId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    userId?: true
    appId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    userId?: true
    appId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    userId: string
    appId: string | null
    token: string
    expiresAt: Date
    createdAt: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    appId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    app?: boolean | Session$appArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    appId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    app?: boolean | Session$appArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    id?: boolean
    userId?: boolean
    appId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    app?: boolean | Session$appArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    app?: boolean | Session$appArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      app: Prisma.$EcosystemAppPayload<ExtArgs> | null
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      appId: string | null
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    app<T extends Session$appArgs<ExtArgs> = {}>(args?: Subset<T, Session$appArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findUniqueOrThrow"> | null, null, ExtArgs>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */ 
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
    readonly appId: FieldRef<"Session", 'String'>
    readonly token: FieldRef<"Session", 'String'>
    readonly expiresAt: FieldRef<"Session", 'DateTime'>
    readonly createdAt: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
  }

  /**
   * Session.app
   */
  export type Session$appArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    where?: EcosystemAppWhereInput
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Model EcosystemApp
   */

  export type AggregateEcosystemApp = {
    _count: EcosystemAppCountAggregateOutputType | null
    _min: EcosystemAppMinAggregateOutputType | null
    _max: EcosystemAppMaxAggregateOutputType | null
  }

  export type EcosystemAppMinAggregateOutputType = {
    id: string | null
    name: string | null
    apiKey: string | null
    apiSecret: string | null
    redirectUri: string | null
    createdAt: Date | null
  }

  export type EcosystemAppMaxAggregateOutputType = {
    id: string | null
    name: string | null
    apiKey: string | null
    apiSecret: string | null
    redirectUri: string | null
    createdAt: Date | null
  }

  export type EcosystemAppCountAggregateOutputType = {
    id: number
    name: number
    apiKey: number
    apiSecret: number
    redirectUri: number
    createdAt: number
    _all: number
  }


  export type EcosystemAppMinAggregateInputType = {
    id?: true
    name?: true
    apiKey?: true
    apiSecret?: true
    redirectUri?: true
    createdAt?: true
  }

  export type EcosystemAppMaxAggregateInputType = {
    id?: true
    name?: true
    apiKey?: true
    apiSecret?: true
    redirectUri?: true
    createdAt?: true
  }

  export type EcosystemAppCountAggregateInputType = {
    id?: true
    name?: true
    apiKey?: true
    apiSecret?: true
    redirectUri?: true
    createdAt?: true
    _all?: true
  }

  export type EcosystemAppAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EcosystemApp to aggregate.
     */
    where?: EcosystemAppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EcosystemApps to fetch.
     */
    orderBy?: EcosystemAppOrderByWithRelationInput | EcosystemAppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EcosystemAppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EcosystemApps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EcosystemApps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EcosystemApps
    **/
    _count?: true | EcosystemAppCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EcosystemAppMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EcosystemAppMaxAggregateInputType
  }

  export type GetEcosystemAppAggregateType<T extends EcosystemAppAggregateArgs> = {
        [P in keyof T & keyof AggregateEcosystemApp]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEcosystemApp[P]>
      : GetScalarType<T[P], AggregateEcosystemApp[P]>
  }




  export type EcosystemAppGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EcosystemAppWhereInput
    orderBy?: EcosystemAppOrderByWithAggregationInput | EcosystemAppOrderByWithAggregationInput[]
    by: EcosystemAppScalarFieldEnum[] | EcosystemAppScalarFieldEnum
    having?: EcosystemAppScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EcosystemAppCountAggregateInputType | true
    _min?: EcosystemAppMinAggregateInputType
    _max?: EcosystemAppMaxAggregateInputType
  }

  export type EcosystemAppGroupByOutputType = {
    id: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt: Date
    _count: EcosystemAppCountAggregateOutputType | null
    _min: EcosystemAppMinAggregateOutputType | null
    _max: EcosystemAppMaxAggregateOutputType | null
  }

  type GetEcosystemAppGroupByPayload<T extends EcosystemAppGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EcosystemAppGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EcosystemAppGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EcosystemAppGroupByOutputType[P]>
            : GetScalarType<T[P], EcosystemAppGroupByOutputType[P]>
        }
      >
    >


  export type EcosystemAppSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    apiKey?: boolean
    apiSecret?: boolean
    redirectUri?: boolean
    createdAt?: boolean
    sessions?: boolean | EcosystemApp$sessionsArgs<ExtArgs>
    _count?: boolean | EcosystemAppCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["ecosystemApp"]>

  export type EcosystemAppSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    apiKey?: boolean
    apiSecret?: boolean
    redirectUri?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["ecosystemApp"]>

  export type EcosystemAppSelectScalar = {
    id?: boolean
    name?: boolean
    apiKey?: boolean
    apiSecret?: boolean
    redirectUri?: boolean
    createdAt?: boolean
  }

  export type EcosystemAppInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | EcosystemApp$sessionsArgs<ExtArgs>
    _count?: boolean | EcosystemAppCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type EcosystemAppIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $EcosystemAppPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EcosystemApp"
    objects: {
      sessions: Prisma.$SessionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      apiKey: string
      apiSecret: string
      redirectUri: string
      createdAt: Date
    }, ExtArgs["result"]["ecosystemApp"]>
    composites: {}
  }

  type EcosystemAppGetPayload<S extends boolean | null | undefined | EcosystemAppDefaultArgs> = $Result.GetResult<Prisma.$EcosystemAppPayload, S>

  type EcosystemAppCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<EcosystemAppFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: EcosystemAppCountAggregateInputType | true
    }

  export interface EcosystemAppDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EcosystemApp'], meta: { name: 'EcosystemApp' } }
    /**
     * Find zero or one EcosystemApp that matches the filter.
     * @param {EcosystemAppFindUniqueArgs} args - Arguments to find a EcosystemApp
     * @example
     * // Get one EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EcosystemAppFindUniqueArgs>(args: SelectSubset<T, EcosystemAppFindUniqueArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one EcosystemApp that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {EcosystemAppFindUniqueOrThrowArgs} args - Arguments to find a EcosystemApp
     * @example
     * // Get one EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EcosystemAppFindUniqueOrThrowArgs>(args: SelectSubset<T, EcosystemAppFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first EcosystemApp that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppFindFirstArgs} args - Arguments to find a EcosystemApp
     * @example
     * // Get one EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EcosystemAppFindFirstArgs>(args?: SelectSubset<T, EcosystemAppFindFirstArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first EcosystemApp that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppFindFirstOrThrowArgs} args - Arguments to find a EcosystemApp
     * @example
     * // Get one EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EcosystemAppFindFirstOrThrowArgs>(args?: SelectSubset<T, EcosystemAppFindFirstOrThrowArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more EcosystemApps that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EcosystemApps
     * const ecosystemApps = await prisma.ecosystemApp.findMany()
     * 
     * // Get first 10 EcosystemApps
     * const ecosystemApps = await prisma.ecosystemApp.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const ecosystemAppWithIdOnly = await prisma.ecosystemApp.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EcosystemAppFindManyArgs>(args?: SelectSubset<T, EcosystemAppFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a EcosystemApp.
     * @param {EcosystemAppCreateArgs} args - Arguments to create a EcosystemApp.
     * @example
     * // Create one EcosystemApp
     * const EcosystemApp = await prisma.ecosystemApp.create({
     *   data: {
     *     // ... data to create a EcosystemApp
     *   }
     * })
     * 
     */
    create<T extends EcosystemAppCreateArgs>(args: SelectSubset<T, EcosystemAppCreateArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many EcosystemApps.
     * @param {EcosystemAppCreateManyArgs} args - Arguments to create many EcosystemApps.
     * @example
     * // Create many EcosystemApps
     * const ecosystemApp = await prisma.ecosystemApp.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EcosystemAppCreateManyArgs>(args?: SelectSubset<T, EcosystemAppCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EcosystemApps and returns the data saved in the database.
     * @param {EcosystemAppCreateManyAndReturnArgs} args - Arguments to create many EcosystemApps.
     * @example
     * // Create many EcosystemApps
     * const ecosystemApp = await prisma.ecosystemApp.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EcosystemApps and only return the `id`
     * const ecosystemAppWithIdOnly = await prisma.ecosystemApp.createManyAndReturn({ 
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EcosystemAppCreateManyAndReturnArgs>(args?: SelectSubset<T, EcosystemAppCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "createManyAndReturn">>

    /**
     * Delete a EcosystemApp.
     * @param {EcosystemAppDeleteArgs} args - Arguments to delete one EcosystemApp.
     * @example
     * // Delete one EcosystemApp
     * const EcosystemApp = await prisma.ecosystemApp.delete({
     *   where: {
     *     // ... filter to delete one EcosystemApp
     *   }
     * })
     * 
     */
    delete<T extends EcosystemAppDeleteArgs>(args: SelectSubset<T, EcosystemAppDeleteArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one EcosystemApp.
     * @param {EcosystemAppUpdateArgs} args - Arguments to update one EcosystemApp.
     * @example
     * // Update one EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EcosystemAppUpdateArgs>(args: SelectSubset<T, EcosystemAppUpdateArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more EcosystemApps.
     * @param {EcosystemAppDeleteManyArgs} args - Arguments to filter EcosystemApps to delete.
     * @example
     * // Delete a few EcosystemApps
     * const { count } = await prisma.ecosystemApp.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EcosystemAppDeleteManyArgs>(args?: SelectSubset<T, EcosystemAppDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EcosystemApps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EcosystemApps
     * const ecosystemApp = await prisma.ecosystemApp.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EcosystemAppUpdateManyArgs>(args: SelectSubset<T, EcosystemAppUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one EcosystemApp.
     * @param {EcosystemAppUpsertArgs} args - Arguments to update or create a EcosystemApp.
     * @example
     * // Update or create a EcosystemApp
     * const ecosystemApp = await prisma.ecosystemApp.upsert({
     *   create: {
     *     // ... data to create a EcosystemApp
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EcosystemApp we want to update
     *   }
     * })
     */
    upsert<T extends EcosystemAppUpsertArgs>(args: SelectSubset<T, EcosystemAppUpsertArgs<ExtArgs>>): Prisma__EcosystemAppClient<$Result.GetResult<Prisma.$EcosystemAppPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of EcosystemApps.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppCountArgs} args - Arguments to filter EcosystemApps to count.
     * @example
     * // Count the number of EcosystemApps
     * const count = await prisma.ecosystemApp.count({
     *   where: {
     *     // ... the filter for the EcosystemApps we want to count
     *   }
     * })
    **/
    count<T extends EcosystemAppCountArgs>(
      args?: Subset<T, EcosystemAppCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EcosystemAppCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EcosystemApp.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EcosystemAppAggregateArgs>(args: Subset<T, EcosystemAppAggregateArgs>): Prisma.PrismaPromise<GetEcosystemAppAggregateType<T>>

    /**
     * Group by EcosystemApp.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EcosystemAppGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EcosystemAppGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EcosystemAppGroupByArgs['orderBy'] }
        : { orderBy?: EcosystemAppGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EcosystemAppGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEcosystemAppGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EcosystemApp model
   */
  readonly fields: EcosystemAppFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EcosystemApp.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EcosystemAppClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sessions<T extends EcosystemApp$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, EcosystemApp$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EcosystemApp model
   */ 
  interface EcosystemAppFieldRefs {
    readonly id: FieldRef<"EcosystemApp", 'String'>
    readonly name: FieldRef<"EcosystemApp", 'String'>
    readonly apiKey: FieldRef<"EcosystemApp", 'String'>
    readonly apiSecret: FieldRef<"EcosystemApp", 'String'>
    readonly redirectUri: FieldRef<"EcosystemApp", 'String'>
    readonly createdAt: FieldRef<"EcosystemApp", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EcosystemApp findUnique
   */
  export type EcosystemAppFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter, which EcosystemApp to fetch.
     */
    where: EcosystemAppWhereUniqueInput
  }

  /**
   * EcosystemApp findUniqueOrThrow
   */
  export type EcosystemAppFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter, which EcosystemApp to fetch.
     */
    where: EcosystemAppWhereUniqueInput
  }

  /**
   * EcosystemApp findFirst
   */
  export type EcosystemAppFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter, which EcosystemApp to fetch.
     */
    where?: EcosystemAppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EcosystemApps to fetch.
     */
    orderBy?: EcosystemAppOrderByWithRelationInput | EcosystemAppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EcosystemApps.
     */
    cursor?: EcosystemAppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EcosystemApps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EcosystemApps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EcosystemApps.
     */
    distinct?: EcosystemAppScalarFieldEnum | EcosystemAppScalarFieldEnum[]
  }

  /**
   * EcosystemApp findFirstOrThrow
   */
  export type EcosystemAppFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter, which EcosystemApp to fetch.
     */
    where?: EcosystemAppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EcosystemApps to fetch.
     */
    orderBy?: EcosystemAppOrderByWithRelationInput | EcosystemAppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EcosystemApps.
     */
    cursor?: EcosystemAppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EcosystemApps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EcosystemApps.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EcosystemApps.
     */
    distinct?: EcosystemAppScalarFieldEnum | EcosystemAppScalarFieldEnum[]
  }

  /**
   * EcosystemApp findMany
   */
  export type EcosystemAppFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter, which EcosystemApps to fetch.
     */
    where?: EcosystemAppWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EcosystemApps to fetch.
     */
    orderBy?: EcosystemAppOrderByWithRelationInput | EcosystemAppOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EcosystemApps.
     */
    cursor?: EcosystemAppWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EcosystemApps from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EcosystemApps.
     */
    skip?: number
    distinct?: EcosystemAppScalarFieldEnum | EcosystemAppScalarFieldEnum[]
  }

  /**
   * EcosystemApp create
   */
  export type EcosystemAppCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * The data needed to create a EcosystemApp.
     */
    data: XOR<EcosystemAppCreateInput, EcosystemAppUncheckedCreateInput>
  }

  /**
   * EcosystemApp createMany
   */
  export type EcosystemAppCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EcosystemApps.
     */
    data: EcosystemAppCreateManyInput | EcosystemAppCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EcosystemApp createManyAndReturn
   */
  export type EcosystemAppCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * The data used to create many EcosystemApps.
     */
    data: EcosystemAppCreateManyInput | EcosystemAppCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EcosystemApp update
   */
  export type EcosystemAppUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * The data needed to update a EcosystemApp.
     */
    data: XOR<EcosystemAppUpdateInput, EcosystemAppUncheckedUpdateInput>
    /**
     * Choose, which EcosystemApp to update.
     */
    where: EcosystemAppWhereUniqueInput
  }

  /**
   * EcosystemApp updateMany
   */
  export type EcosystemAppUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EcosystemApps.
     */
    data: XOR<EcosystemAppUpdateManyMutationInput, EcosystemAppUncheckedUpdateManyInput>
    /**
     * Filter which EcosystemApps to update
     */
    where?: EcosystemAppWhereInput
  }

  /**
   * EcosystemApp upsert
   */
  export type EcosystemAppUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * The filter to search for the EcosystemApp to update in case it exists.
     */
    where: EcosystemAppWhereUniqueInput
    /**
     * In case the EcosystemApp found by the `where` argument doesn't exist, create a new EcosystemApp with this data.
     */
    create: XOR<EcosystemAppCreateInput, EcosystemAppUncheckedCreateInput>
    /**
     * In case the EcosystemApp was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EcosystemAppUpdateInput, EcosystemAppUncheckedUpdateInput>
  }

  /**
   * EcosystemApp delete
   */
  export type EcosystemAppDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
    /**
     * Filter which EcosystemApp to delete.
     */
    where: EcosystemAppWhereUniqueInput
  }

  /**
   * EcosystemApp deleteMany
   */
  export type EcosystemAppDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EcosystemApps to delete
     */
    where?: EcosystemAppWhereInput
  }

  /**
   * EcosystemApp.sessions
   */
  export type EcosystemApp$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * EcosystemApp without action
   */
  export type EcosystemAppDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EcosystemApp
     */
    select?: EcosystemAppSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EcosystemAppInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    phoneNumber: 'phoneNumber',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
    department: 'department',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    isFaceVerified: 'isFaceVerified',
    kycData: 'kycData',
    kycStatus: 'kycStatus',
    kycTier: 'kycTier',
    otpCode: 'otpCode',
    otpExpiresAt: 'otpExpiresAt',
    otpUpdatedAt: 'otpUpdatedAt',
    emailVerified: 'emailVerified',
    phoneVerified: 'phoneVerified',
    avatarUrl: 'avatarUrl',
    faceTemplate: 'faceTemplate',
    lastLoginAt: 'lastLoginAt',
    pinHash: 'pinHash',
    biometricKeyId: 'biometricKeyId',
    biometricPublicKey: 'biometricPublicKey',
    trustedDevices: 'trustedDevices'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    appId: 'appId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const EcosystemAppScalarFieldEnum: {
    id: 'id',
    name: 'name',
    apiKey: 'apiKey',
    apiSecret: 'apiSecret',
    redirectUri: 'redirectUri',
    createdAt: 'createdAt'
  };

  export type EcosystemAppScalarFieldEnum = (typeof EcosystemAppScalarFieldEnum)[keyof typeof EcosystemAppScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'KYCStatus'
   */
  export type EnumKYCStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KYCStatus'>
    


  /**
   * Reference to a field of type 'KYCStatus[]'
   */
  export type ListEnumKYCStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KYCStatus[]'>
    


  /**
   * Reference to a field of type 'KYCTier'
   */
  export type EnumKYCTierFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KYCTier'>
    


  /**
   * Reference to a field of type 'KYCTier[]'
   */
  export type ListEnumKYCTierFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'KYCTier[]'>
    


  /**
   * Reference to a field of type 'Bytes'
   */
  export type BytesFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Bytes'>
    


  /**
   * Reference to a field of type 'Bytes[]'
   */
  export type ListBytesFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Bytes[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    phoneNumber?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    department?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    isFaceVerified?: BoolFilter<"User"> | boolean
    kycData?: JsonNullableFilter<"User">
    kycStatus?: EnumKYCStatusFilter<"User"> | $Enums.KYCStatus
    kycTier?: EnumKYCTierFilter<"User"> | $Enums.KYCTier
    otpCode?: StringNullableFilter<"User"> | string | null
    otpExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    otpUpdatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailVerified?: BoolFilter<"User"> | boolean
    phoneVerified?: BoolFilter<"User"> | boolean
    avatarUrl?: StringNullableFilter<"User"> | string | null
    faceTemplate?: StringNullableFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    pinHash?: StringNullableFilter<"User"> | string | null
    biometricKeyId?: StringNullableFilter<"User"> | string | null
    biometricPublicKey?: BytesNullableFilter<"User"> | Buffer | null
    trustedDevices?: StringNullableFilter<"User"> | string | null
    sessions?: SessionListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    phoneNumber?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    role?: SortOrder
    department?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isFaceVerified?: SortOrder
    kycData?: SortOrderInput | SortOrder
    kycStatus?: SortOrder
    kycTier?: SortOrder
    otpCode?: SortOrderInput | SortOrder
    otpExpiresAt?: SortOrderInput | SortOrder
    otpUpdatedAt?: SortOrderInput | SortOrder
    emailVerified?: SortOrder
    phoneVerified?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    faceTemplate?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    pinHash?: SortOrderInput | SortOrder
    biometricKeyId?: SortOrderInput | SortOrder
    biometricPublicKey?: SortOrderInput | SortOrder
    trustedDevices?: SortOrderInput | SortOrder
    sessions?: SessionOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    phoneNumber?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    passwordHash?: StringFilter<"User"> | string
    firstName?: StringNullableFilter<"User"> | string | null
    lastName?: StringNullableFilter<"User"> | string | null
    role?: EnumUserRoleFilter<"User"> | $Enums.UserRole
    department?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    isFaceVerified?: BoolFilter<"User"> | boolean
    kycData?: JsonNullableFilter<"User">
    kycStatus?: EnumKYCStatusFilter<"User"> | $Enums.KYCStatus
    kycTier?: EnumKYCTierFilter<"User"> | $Enums.KYCTier
    otpCode?: StringNullableFilter<"User"> | string | null
    otpExpiresAt?: DateTimeNullableFilter<"User"> | Date | string | null
    otpUpdatedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    emailVerified?: BoolFilter<"User"> | boolean
    phoneVerified?: BoolFilter<"User"> | boolean
    avatarUrl?: StringNullableFilter<"User"> | string | null
    faceTemplate?: StringNullableFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    pinHash?: StringNullableFilter<"User"> | string | null
    biometricKeyId?: StringNullableFilter<"User"> | string | null
    biometricPublicKey?: BytesNullableFilter<"User"> | Buffer | null
    trustedDevices?: StringNullableFilter<"User"> | string | null
    sessions?: SessionListRelationFilter
  }, "id" | "email" | "phoneNumber">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    phoneNumber?: SortOrder
    firstName?: SortOrderInput | SortOrder
    lastName?: SortOrderInput | SortOrder
    role?: SortOrder
    department?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isFaceVerified?: SortOrder
    kycData?: SortOrderInput | SortOrder
    kycStatus?: SortOrder
    kycTier?: SortOrder
    otpCode?: SortOrderInput | SortOrder
    otpExpiresAt?: SortOrderInput | SortOrder
    otpUpdatedAt?: SortOrderInput | SortOrder
    emailVerified?: SortOrder
    phoneVerified?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    faceTemplate?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    pinHash?: SortOrderInput | SortOrder
    biometricKeyId?: SortOrderInput | SortOrder
    biometricPublicKey?: SortOrderInput | SortOrder
    trustedDevices?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    phoneNumber?: StringWithAggregatesFilter<"User"> | string
    firstName?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastName?: StringNullableWithAggregatesFilter<"User"> | string | null
    role?: EnumUserRoleWithAggregatesFilter<"User"> | $Enums.UserRole
    department?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    isFaceVerified?: BoolWithAggregatesFilter<"User"> | boolean
    kycData?: JsonNullableWithAggregatesFilter<"User">
    kycStatus?: EnumKYCStatusWithAggregatesFilter<"User"> | $Enums.KYCStatus
    kycTier?: EnumKYCTierWithAggregatesFilter<"User"> | $Enums.KYCTier
    otpCode?: StringNullableWithAggregatesFilter<"User"> | string | null
    otpExpiresAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    otpUpdatedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    phoneVerified?: BoolWithAggregatesFilter<"User"> | boolean
    avatarUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    faceTemplate?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    pinHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    biometricKeyId?: StringNullableWithAggregatesFilter<"User"> | string | null
    biometricPublicKey?: BytesNullableWithAggregatesFilter<"User"> | Buffer | null
    trustedDevices?: StringNullableWithAggregatesFilter<"User"> | string | null
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    appId?: StringNullableFilter<"Session"> | string | null
    token?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    app?: XOR<EcosystemAppNullableRelationFilter, EcosystemAppWhereInput> | null
    user?: XOR<UserRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    appId?: SortOrderInput | SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    app?: EcosystemAppOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    userId?: StringFilter<"Session"> | string
    appId?: StringNullableFilter<"Session"> | string | null
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    app?: XOR<EcosystemAppNullableRelationFilter, EcosystemAppWhereInput> | null
    user?: XOR<UserRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    appId?: SortOrderInput | SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    userId?: StringWithAggregatesFilter<"Session"> | string
    appId?: StringNullableWithAggregatesFilter<"Session"> | string | null
    token?: StringWithAggregatesFilter<"Session"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type EcosystemAppWhereInput = {
    AND?: EcosystemAppWhereInput | EcosystemAppWhereInput[]
    OR?: EcosystemAppWhereInput[]
    NOT?: EcosystemAppWhereInput | EcosystemAppWhereInput[]
    id?: StringFilter<"EcosystemApp"> | string
    name?: StringFilter<"EcosystemApp"> | string
    apiKey?: StringFilter<"EcosystemApp"> | string
    apiSecret?: StringFilter<"EcosystemApp"> | string
    redirectUri?: StringFilter<"EcosystemApp"> | string
    createdAt?: DateTimeFilter<"EcosystemApp"> | Date | string
    sessions?: SessionListRelationFilter
  }

  export type EcosystemAppOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    redirectUri?: SortOrder
    createdAt?: SortOrder
    sessions?: SessionOrderByRelationAggregateInput
  }

  export type EcosystemAppWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    apiKey?: string
    apiSecret?: string
    AND?: EcosystemAppWhereInput | EcosystemAppWhereInput[]
    OR?: EcosystemAppWhereInput[]
    NOT?: EcosystemAppWhereInput | EcosystemAppWhereInput[]
    redirectUri?: StringFilter<"EcosystemApp"> | string
    createdAt?: DateTimeFilter<"EcosystemApp"> | Date | string
    sessions?: SessionListRelationFilter
  }, "id" | "name" | "apiKey" | "apiSecret">

  export type EcosystemAppOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    redirectUri?: SortOrder
    createdAt?: SortOrder
    _count?: EcosystemAppCountOrderByAggregateInput
    _max?: EcosystemAppMaxOrderByAggregateInput
    _min?: EcosystemAppMinOrderByAggregateInput
  }

  export type EcosystemAppScalarWhereWithAggregatesInput = {
    AND?: EcosystemAppScalarWhereWithAggregatesInput | EcosystemAppScalarWhereWithAggregatesInput[]
    OR?: EcosystemAppScalarWhereWithAggregatesInput[]
    NOT?: EcosystemAppScalarWhereWithAggregatesInput | EcosystemAppScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EcosystemApp"> | string
    name?: StringWithAggregatesFilter<"EcosystemApp"> | string
    apiKey?: StringWithAggregatesFilter<"EcosystemApp"> | string
    apiSecret?: StringWithAggregatesFilter<"EcosystemApp"> | string
    redirectUri?: StringWithAggregatesFilter<"EcosystemApp"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EcosystemApp"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName?: string | null
    lastName?: string | null
    role?: $Enums.UserRole
    department?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isFaceVerified?: boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: $Enums.KYCStatus
    kycTier?: $Enums.KYCTier
    otpCode?: string | null
    otpExpiresAt?: Date | string | null
    otpUpdatedAt?: Date | string | null
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: string | null
    faceTemplate?: string | null
    lastLoginAt?: Date | string | null
    pinHash?: string | null
    biometricKeyId?: string | null
    biometricPublicKey?: Buffer | null
    trustedDevices?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName?: string | null
    lastName?: string | null
    role?: $Enums.UserRole
    department?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isFaceVerified?: boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: $Enums.KYCStatus
    kycTier?: $Enums.KYCTier
    otpCode?: string | null
    otpExpiresAt?: Date | string | null
    otpUpdatedAt?: Date | string | null
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: string | null
    faceTemplate?: string | null
    lastLoginAt?: Date | string | null
    pinHash?: string | null
    biometricKeyId?: string | null
    biometricPublicKey?: Buffer | null
    trustedDevices?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName?: string | null
    lastName?: string | null
    role?: $Enums.UserRole
    department?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isFaceVerified?: boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: $Enums.KYCStatus
    kycTier?: $Enums.KYCTier
    otpCode?: string | null
    otpExpiresAt?: Date | string | null
    otpUpdatedAt?: Date | string | null
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: string | null
    faceTemplate?: string | null
    lastLoginAt?: Date | string | null
    pinHash?: string | null
    biometricKeyId?: string | null
    biometricPublicKey?: Buffer | null
    trustedDevices?: string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    app?: EcosystemAppCreateNestedOneWithoutSessionsInput
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id?: string
    userId: string
    appId?: string | null
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    app?: EcosystemAppUpdateOneWithoutSessionsNestedInput
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appId?: NullableStringFieldUpdateOperationsInput | string | null
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    id?: string
    userId: string
    appId?: string | null
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    appId?: NullableStringFieldUpdateOperationsInput | string | null
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EcosystemAppCreateInput = {
    id?: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt?: Date | string
    sessions?: SessionCreateNestedManyWithoutAppInput
  }

  export type EcosystemAppUncheckedCreateInput = {
    id?: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt?: Date | string
    sessions?: SessionUncheckedCreateNestedManyWithoutAppInput
  }

  export type EcosystemAppUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUpdateManyWithoutAppNestedInput
  }

  export type EcosystemAppUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUncheckedUpdateManyWithoutAppNestedInput
  }

  export type EcosystemAppCreateManyInput = {
    id?: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt?: Date | string
  }

  export type EcosystemAppUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EcosystemAppUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }
  export type JsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type EnumKYCStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCStatus | EnumKYCStatusFieldRefInput<$PrismaModel>
    in?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCStatusFilter<$PrismaModel> | $Enums.KYCStatus
  }

  export type EnumKYCTierFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCTier | EnumKYCTierFieldRefInput<$PrismaModel>
    in?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCTierFilter<$PrismaModel> | $Enums.KYCTier
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BytesNullableFilter<$PrismaModel = never> = {
    equals?: Buffer | BytesFieldRefInput<$PrismaModel> | null
    in?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableFilter<$PrismaModel> | Buffer | null
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    phoneNumber?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    department?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isFaceVerified?: SortOrder
    kycData?: SortOrder
    kycStatus?: SortOrder
    kycTier?: SortOrder
    otpCode?: SortOrder
    otpExpiresAt?: SortOrder
    otpUpdatedAt?: SortOrder
    emailVerified?: SortOrder
    phoneVerified?: SortOrder
    avatarUrl?: SortOrder
    faceTemplate?: SortOrder
    lastLoginAt?: SortOrder
    pinHash?: SortOrder
    biometricKeyId?: SortOrder
    biometricPublicKey?: SortOrder
    trustedDevices?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    phoneNumber?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    department?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isFaceVerified?: SortOrder
    kycStatus?: SortOrder
    kycTier?: SortOrder
    otpCode?: SortOrder
    otpExpiresAt?: SortOrder
    otpUpdatedAt?: SortOrder
    emailVerified?: SortOrder
    phoneVerified?: SortOrder
    avatarUrl?: SortOrder
    faceTemplate?: SortOrder
    lastLoginAt?: SortOrder
    pinHash?: SortOrder
    biometricKeyId?: SortOrder
    biometricPublicKey?: SortOrder
    trustedDevices?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    phoneNumber?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    role?: SortOrder
    department?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    isFaceVerified?: SortOrder
    kycStatus?: SortOrder
    kycTier?: SortOrder
    otpCode?: SortOrder
    otpExpiresAt?: SortOrder
    otpUpdatedAt?: SortOrder
    emailVerified?: SortOrder
    phoneVerified?: SortOrder
    avatarUrl?: SortOrder
    faceTemplate?: SortOrder
    lastLoginAt?: SortOrder
    pinHash?: SortOrder
    biometricKeyId?: SortOrder
    biometricPublicKey?: SortOrder
    trustedDevices?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EnumKYCStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCStatus | EnumKYCStatusFieldRefInput<$PrismaModel>
    in?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCStatusWithAggregatesFilter<$PrismaModel> | $Enums.KYCStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumKYCStatusFilter<$PrismaModel>
    _max?: NestedEnumKYCStatusFilter<$PrismaModel>
  }

  export type EnumKYCTierWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCTier | EnumKYCTierFieldRefInput<$PrismaModel>
    in?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCTierWithAggregatesFilter<$PrismaModel> | $Enums.KYCTier
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumKYCTierFilter<$PrismaModel>
    _max?: NestedEnumKYCTierFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BytesNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Buffer | BytesFieldRefInput<$PrismaModel> | null
    in?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableWithAggregatesFilter<$PrismaModel> | Buffer | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBytesNullableFilter<$PrismaModel>
    _max?: NestedBytesNullableFilter<$PrismaModel>
  }

  export type EcosystemAppNullableRelationFilter = {
    is?: EcosystemAppWhereInput | null
    isNot?: EcosystemAppWhereInput | null
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    appId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    appId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    appId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EcosystemAppCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    redirectUri?: SortOrder
    createdAt?: SortOrder
  }

  export type EcosystemAppMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    redirectUri?: SortOrder
    createdAt?: SortOrder
  }

  export type EcosystemAppMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    apiKey?: SortOrder
    apiSecret?: SortOrder
    redirectUri?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type EnumKYCStatusFieldUpdateOperationsInput = {
    set?: $Enums.KYCStatus
  }

  export type EnumKYCTierFieldUpdateOperationsInput = {
    set?: $Enums.KYCTier
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableBytesFieldUpdateOperationsInput = {
    set?: Buffer | null
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type EcosystemAppCreateNestedOneWithoutSessionsInput = {
    create?: XOR<EcosystemAppCreateWithoutSessionsInput, EcosystemAppUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: EcosystemAppCreateOrConnectWithoutSessionsInput
    connect?: EcosystemAppWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type EcosystemAppUpdateOneWithoutSessionsNestedInput = {
    create?: XOR<EcosystemAppCreateWithoutSessionsInput, EcosystemAppUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: EcosystemAppCreateOrConnectWithoutSessionsInput
    upsert?: EcosystemAppUpsertWithoutSessionsInput
    disconnect?: EcosystemAppWhereInput | boolean
    delete?: EcosystemAppWhereInput | boolean
    connect?: EcosystemAppWhereUniqueInput
    update?: XOR<XOR<EcosystemAppUpdateToOneWithWhereWithoutSessionsInput, EcosystemAppUpdateWithoutSessionsInput>, EcosystemAppUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type SessionCreateNestedManyWithoutAppInput = {
    create?: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput> | SessionCreateWithoutAppInput[] | SessionUncheckedCreateWithoutAppInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutAppInput | SessionCreateOrConnectWithoutAppInput[]
    createMany?: SessionCreateManyAppInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutAppInput = {
    create?: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput> | SessionCreateWithoutAppInput[] | SessionUncheckedCreateWithoutAppInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutAppInput | SessionCreateOrConnectWithoutAppInput[]
    createMany?: SessionCreateManyAppInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SessionUpdateManyWithoutAppNestedInput = {
    create?: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput> | SessionCreateWithoutAppInput[] | SessionUncheckedCreateWithoutAppInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutAppInput | SessionCreateOrConnectWithoutAppInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutAppInput | SessionUpsertWithWhereUniqueWithoutAppInput[]
    createMany?: SessionCreateManyAppInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutAppInput | SessionUpdateWithWhereUniqueWithoutAppInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutAppInput | SessionUpdateManyWithWhereWithoutAppInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutAppNestedInput = {
    create?: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput> | SessionCreateWithoutAppInput[] | SessionUncheckedCreateWithoutAppInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutAppInput | SessionCreateOrConnectWithoutAppInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutAppInput | SessionUpsertWithWhereUniqueWithoutAppInput[]
    createMany?: SessionCreateManyAppInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutAppInput | SessionUpdateWithWhereUniqueWithoutAppInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutAppInput | SessionUpdateManyWithWhereWithoutAppInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedEnumKYCStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCStatus | EnumKYCStatusFieldRefInput<$PrismaModel>
    in?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCStatusFilter<$PrismaModel> | $Enums.KYCStatus
  }

  export type NestedEnumKYCTierFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCTier | EnumKYCTierFieldRefInput<$PrismaModel>
    in?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCTierFilter<$PrismaModel> | $Enums.KYCTier
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBytesNullableFilter<$PrismaModel = never> = {
    equals?: Buffer | BytesFieldRefInput<$PrismaModel> | null
    in?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableFilter<$PrismaModel> | Buffer | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumKYCStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCStatus | EnumKYCStatusFieldRefInput<$PrismaModel>
    in?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCStatus[] | ListEnumKYCStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCStatusWithAggregatesFilter<$PrismaModel> | $Enums.KYCStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumKYCStatusFilter<$PrismaModel>
    _max?: NestedEnumKYCStatusFilter<$PrismaModel>
  }

  export type NestedEnumKYCTierWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.KYCTier | EnumKYCTierFieldRefInput<$PrismaModel>
    in?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    notIn?: $Enums.KYCTier[] | ListEnumKYCTierFieldRefInput<$PrismaModel>
    not?: NestedEnumKYCTierWithAggregatesFilter<$PrismaModel> | $Enums.KYCTier
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumKYCTierFilter<$PrismaModel>
    _max?: NestedEnumKYCTierFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBytesNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Buffer | BytesFieldRefInput<$PrismaModel> | null
    in?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Buffer[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableWithAggregatesFilter<$PrismaModel> | Buffer | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBytesNullableFilter<$PrismaModel>
    _max?: NestedBytesNullableFilter<$PrismaModel>
  }

  export type SessionCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    app?: EcosystemAppCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id?: string
    appId?: string | null
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    appId?: StringNullableFilter<"Session"> | string | null
    token?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
  }

  export type EcosystemAppCreateWithoutSessionsInput = {
    id?: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt?: Date | string
  }

  export type EcosystemAppUncheckedCreateWithoutSessionsInput = {
    id?: string
    name: string
    apiKey: string
    apiSecret: string
    redirectUri: string
    createdAt?: Date | string
  }

  export type EcosystemAppCreateOrConnectWithoutSessionsInput = {
    where: EcosystemAppWhereUniqueInput
    create: XOR<EcosystemAppCreateWithoutSessionsInput, EcosystemAppUncheckedCreateWithoutSessionsInput>
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName?: string | null
    lastName?: string | null
    role?: $Enums.UserRole
    department?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isFaceVerified?: boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: $Enums.KYCStatus
    kycTier?: $Enums.KYCTier
    otpCode?: string | null
    otpExpiresAt?: Date | string | null
    otpUpdatedAt?: Date | string | null
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: string | null
    faceTemplate?: string | null
    lastLoginAt?: Date | string | null
    pinHash?: string | null
    biometricKeyId?: string | null
    biometricPublicKey?: Buffer | null
    trustedDevices?: string | null
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    phoneNumber: string
    firstName?: string | null
    lastName?: string | null
    role?: $Enums.UserRole
    department?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    isFaceVerified?: boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: $Enums.KYCStatus
    kycTier?: $Enums.KYCTier
    otpCode?: string | null
    otpExpiresAt?: Date | string | null
    otpUpdatedAt?: Date | string | null
    emailVerified?: boolean
    phoneVerified?: boolean
    avatarUrl?: string | null
    faceTemplate?: string | null
    lastLoginAt?: Date | string | null
    pinHash?: string | null
    biometricKeyId?: string | null
    biometricPublicKey?: Buffer | null
    trustedDevices?: string | null
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type EcosystemAppUpsertWithoutSessionsInput = {
    update: XOR<EcosystemAppUpdateWithoutSessionsInput, EcosystemAppUncheckedUpdateWithoutSessionsInput>
    create: XOR<EcosystemAppCreateWithoutSessionsInput, EcosystemAppUncheckedCreateWithoutSessionsInput>
    where?: EcosystemAppWhereInput
  }

  export type EcosystemAppUpdateToOneWithWhereWithoutSessionsInput = {
    where?: EcosystemAppWhereInput
    data: XOR<EcosystemAppUpdateWithoutSessionsInput, EcosystemAppUncheckedUpdateWithoutSessionsInput>
  }

  export type EcosystemAppUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EcosystemAppUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    apiKey?: StringFieldUpdateOperationsInput | string
    apiSecret?: StringFieldUpdateOperationsInput | string
    redirectUri?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    firstName?: NullableStringFieldUpdateOperationsInput | string | null
    lastName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    department?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    isFaceVerified?: BoolFieldUpdateOperationsInput | boolean
    kycData?: NullableJsonNullValueInput | InputJsonValue
    kycStatus?: EnumKYCStatusFieldUpdateOperationsInput | $Enums.KYCStatus
    kycTier?: EnumKYCTierFieldUpdateOperationsInput | $Enums.KYCTier
    otpCode?: NullableStringFieldUpdateOperationsInput | string | null
    otpExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    otpUpdatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    phoneVerified?: BoolFieldUpdateOperationsInput | boolean
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    faceTemplate?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    pinHash?: NullableStringFieldUpdateOperationsInput | string | null
    biometricKeyId?: NullableStringFieldUpdateOperationsInput | string | null
    biometricPublicKey?: NullableBytesFieldUpdateOperationsInput | Buffer | null
    trustedDevices?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionCreateWithoutAppInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateWithoutAppInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionCreateOrConnectWithoutAppInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput>
  }

  export type SessionCreateManyAppInputEnvelope = {
    data: SessionCreateManyAppInput | SessionCreateManyAppInput[]
    skipDuplicates?: boolean
  }

  export type SessionUpsertWithWhereUniqueWithoutAppInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutAppInput, SessionUncheckedUpdateWithoutAppInput>
    create: XOR<SessionCreateWithoutAppInput, SessionUncheckedCreateWithoutAppInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutAppInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutAppInput, SessionUncheckedUpdateWithoutAppInput>
  }

  export type SessionUpdateManyWithWhereWithoutAppInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutAppInput>
  }

  export type SessionCreateManyUserInput = {
    id?: string
    appId?: string | null
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    app?: EcosystemAppUpdateOneWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    appId?: NullableStringFieldUpdateOperationsInput | string | null
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    appId?: NullableStringFieldUpdateOperationsInput | string | null
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyAppInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateWithoutAppInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateWithoutAppInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutAppInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use EcosystemAppCountOutputTypeDefaultArgs instead
     */
    export type EcosystemAppCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = EcosystemAppCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use SessionDefaultArgs instead
     */
    export type SessionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = SessionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use EcosystemAppDefaultArgs instead
     */
    export type EcosystemAppArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = EcosystemAppDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}