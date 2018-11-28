"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var GraphQLModule_1;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const metadata_scanner_1 = require("@nestjs/core/metadata-scanner");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_1 = require("graphql");
const lodash_1 = require("lodash");
const graphql_ast_explorer_1 = require("./graphql-ast.explorer");
const graphql_types_loader_1 = require("./graphql-types.loader");
const graphql_constants_1 = require("./graphql.constants");
const graphql_factory_1 = require("./graphql.factory");
const delegates_explorer_service_1 = require("./services/delegates-explorer.service");
const resolvers_explorer_service_1 = require("./services/resolvers-explorer.service");
const scalars_explorer_service_1 = require("./services/scalars-explorer.service");
const extend_util_1 = require("./utils/extend.util");
const generate_token_util_1 = require("./utils/generate-token.util");
const merge_defaults_util_1 = require("./utils/merge-defaults.util");
let GraphQLModule = GraphQLModule_1 = class GraphQLModule {
    constructor(appRefHost, options, graphQLFactory, graphqlTypesLoader) {
        this.appRefHost = appRefHost;
        this.options = options;
        this.graphQLFactory = graphQLFactory;
        this.graphqlTypesLoader = graphqlTypesLoader;
    }
    static forRoot(options = {}) {
        options = merge_defaults_util_1.mergeDefaults(options);
        return {
            module: GraphQLModule_1,
            providers: [
                {
                    provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                    useValue: options,
                },
            ],
        };
    }
    static forRootAsync(options) {
        return {
            module: GraphQLModule_1,
            imports: options.imports,
            providers: [
                ...this.createAsyncProviders(options),
                {
                    provide: graphql_constants_1.GRAPHQL_MODULE_ID,
                    useValue: generate_token_util_1.generateString(),
                },
            ],
        };
    }
    static createAsyncProviders(options) {
        if (options.useExisting || options.useFactory) {
            return [this.createAsyncOptionsProvider(options)];
        }
        return [
            this.createAsyncOptionsProvider(options),
            {
                provide: options.useClass,
                useClass: options.useClass,
            },
        ];
    }
    static createAsyncOptionsProvider(options) {
        if (options.useFactory) {
            return {
                provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
                useFactory: options.useFactory,
                inject: options.inject || [],
            };
        }
        return {
            provide: graphql_constants_1.GRAPHQL_MODULE_OPTIONS,
            useFactory: (optionsFactory) => __awaiter(this, void 0, void 0, function* () { return yield optionsFactory.createGqlOptions(); }),
            inject: [options.useExisting || options.useClass],
        };
    }
    onModuleInit() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.appRefHost) {
                return;
            }
            const httpServer = this.appRefHost.applicationRef;
            if (!httpServer) {
                return;
            }
            const { path, disableHealthCheck, onHealthCheck, cors, bodyParserConfig, } = this.options;
            const app = httpServer.getInstance();
            const typePathsExists = this.options.typePaths && !lodash_1.isEmpty(this.options.typePaths);
            const typeDefs = typePathsExists
                ? this.graphqlTypesLoader.mergeTypesByPaths(...(this.options.typePaths || []))
                : [];
            const mergedTypeDefs = extend_util_1.extend(typeDefs, this.options.typeDefs);
            const apolloOptions = yield this.graphQLFactory.mergeOptions(Object.assign({}, this.options, { typeDefs: mergedTypeDefs }));
            if (this.options.definitions && this.options.definitions.path) {
                yield this.graphQLFactory.generateDefinitions(graphql_1.printSchema(apolloOptions.schema), this.options);
            }
            this.apolloServer = new apollo_server_express_1.ApolloServer(apolloOptions);
            this.apolloServer.applyMiddleware({
                app,
                path,
                disableHealthCheck,
                onHealthCheck,
                cors,
                bodyParserConfig,
            });
            if (this.options.installSubscriptionHandlers) {
                this.apolloServer.installSubscriptionHandlers(httpServer.getHttpServer());
            }
        });
    }
};
GraphQLModule = GraphQLModule_1 = __decorate([
    common_1.Module({
        providers: [
            graphql_factory_1.GraphQLFactory,
            metadata_scanner_1.MetadataScanner,
            resolvers_explorer_service_1.ResolversExplorerService,
            delegates_explorer_service_1.DelegatesExplorerService,
            scalars_explorer_service_1.ScalarsExplorerService,
            graphql_ast_explorer_1.GraphQLAstExplorer,
            graphql_types_loader_1.GraphQLTypesLoader,
        ],
        exports: [graphql_types_loader_1.GraphQLTypesLoader, graphql_ast_explorer_1.GraphQLAstExplorer],
    }),
    __param(1, common_1.Inject(graphql_constants_1.GRAPHQL_MODULE_OPTIONS)),
    __metadata("design:paramtypes", [core_1.ApplicationReferenceHost, Object, graphql_factory_1.GraphQLFactory,
        graphql_types_loader_1.GraphQLTypesLoader])
], GraphQLModule);
exports.GraphQLModule = GraphQLModule;
