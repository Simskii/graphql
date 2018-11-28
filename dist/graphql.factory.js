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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const apollo_server_express_1 = require("apollo-server-express");
const lodash_1 = require("lodash");
const graphql_ast_explorer_1 = require("./graphql-ast.explorer");
const delegates_explorer_service_1 = require("./services/delegates-explorer.service");
const resolvers_explorer_service_1 = require("./services/resolvers-explorer.service");
const scalars_explorer_service_1 = require("./services/scalars-explorer.service");
const extend_util_1 = require("./utils/extend.util");
let GraphQLFactory = class GraphQLFactory {
    constructor(resolversExplorerService, delegatesExplorerService, scalarsExplorerService, graphqlAstExplorer) {
        this.resolversExplorerService = resolversExplorerService;
        this.delegatesExplorerService = delegatesExplorerService;
        this.scalarsExplorerService = scalarsExplorerService;
        this.graphqlAstExplorer = graphqlAstExplorer;
    }
    mergeOptions(options = { typeDefs: [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            const resolvers = extend_util_1.extend(this.scalarsExplorerService.explore(), this.resolversExplorerService.explore());
            if (lodash_1.isEmpty(options.typeDefs)) {
                return Object.assign({}, options, { typeDefs: undefined, schema: options.transformSchema
                        ? yield options.transformSchema(options.schema)
                        : options.schema });
            }
            const executableSchema = apollo_server_express_1.makeExecutableSchema({
                resolvers: extend_util_1.extend(resolvers, options.resolvers),
                directiveResolvers: options.directiveResolvers,
                schemaDirectives: options.schemaDirectives,
                typeDefs: apollo_server_express_1.gql `
        ${options.typeDefs}
      `,
                resolverValidationOptions: options.resolverValidationOptions,
            });
            const schema = options.schema
                ? apollo_server_express_1.mergeSchemas({
                    schemas: [options.schema, executableSchema],
                })
                : executableSchema;
            return Object.assign({}, options, { typeDefs: undefined, schema: options.transformSchema
                    ? yield options.transformSchema(schema)
                    : schema });
        });
    }
    createDelegates() {
        return this.delegatesExplorerService.explore();
    }
    generateDefinitions(typeDefs, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lodash_1.isEmpty(typeDefs) || !options.definitions) {
                return;
            }
            const tsFile = this.graphqlAstExplorer.explore(apollo_server_express_1.gql `
        ${typeDefs}
      `, options.definitions.path, options.definitions.outputAs);
            yield tsFile.save();
        });
    }
};
GraphQLFactory = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [resolvers_explorer_service_1.ResolversExplorerService,
        delegates_explorer_service_1.DelegatesExplorerService,
        scalars_explorer_service_1.ScalarsExplorerService,
        graphql_ast_explorer_1.GraphQLAstExplorer])
], GraphQLFactory);
exports.GraphQLFactory = GraphQLFactory;
