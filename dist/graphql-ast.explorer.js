"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const lodash_1 = require("lodash");
const ts_simple_ast_1 = require("ts-simple-ast");
let GraphQLAstExplorer = class GraphQLAstExplorer {
    constructor() {
        this.root = ['Query', 'Mutation', 'Subscription'];
    }
    explore(documentNode, outputPath, mode) {
        if (!documentNode) {
            return;
        }
        const tsAstHelper = new ts_simple_ast_1.default();
        const tsFile = tsAstHelper.createSourceFile(outputPath, '', {
            overwrite: true,
        });
        let { definitions } = documentNode;
        definitions = lodash_1.sortBy(definitions, 'kind');
        definitions.forEach(item => this.lookupDefinition(item, tsFile, mode));
        return tsFile;
    }
    lookupDefinition(item, tsFile, mode) {
        switch (item.kind) {
            case 'SchemaDefinition':
                return this.lookupRootSchemaDefinition(item.operationTypes, tsFile, mode);
            case 'ObjectTypeDefinition':
            case 'InputObjectTypeDefinition':
                return this.addObjectTypeDefinition(item, tsFile, mode);
            case 'InterfaceTypeDefinition':
                return this.addObjectTypeDefinition(item, tsFile, 'interface');
            case 'ScalarTypeDefinition':
                return this.addScalarDefinition(item, tsFile);
            case 'EnumTypeDefinition':
                return this.addEnumDefinition(item, tsFile);
            case 'UnionTypeDefinition':
                return this.addUnionDefinition(item, tsFile);
        }
    }
    lookupRootSchemaDefinition(operationTypes, tsFile, mode) {
        const rootInterface = this.addClassOrInterface(tsFile, mode, {
            name: 'ISchema',
            isExported: true,
        });
        operationTypes.forEach(item => {
            if (!item) {
                return;
            }
            const tempOperationName = item.operation;
            const typeName = lodash_1.get(item, 'type.name.value');
            const interfaceName = typeName || tempOperationName;
            const interfaceRef = this.addClassOrInterface(tsFile, mode, {
                name: this.addSymbolIfRoot(lodash_1.upperFirst(interfaceName)),
                isExported: true,
            });
            rootInterface.addProperty({
                name: interfaceName,
                type: interfaceRef.getName(),
            });
        });
    }
    addObjectTypeDefinition(item, tsFile, mode) {
        const parentName = lodash_1.get(item, 'name.value');
        if (!parentName) {
            return;
        }
        let parentRef = this.getClassOrInterface(tsFile, mode, this.addSymbolIfRoot(parentName));
        if (!parentRef) {
            const isRoot = this.root.indexOf(parentName) >= 0;
            parentRef = this.addClassOrInterface(tsFile, mode, {
                name: this.addSymbolIfRoot(lodash_1.upperFirst(parentName)),
                isExported: true,
                isAbstract: isRoot && mode === 'class',
            });
        }
        const interfaces = lodash_1.get(item, 'interfaces');
        if (interfaces) {
            if (mode === 'class') {
                this.addImplementsInterfaces(interfaces, parentRef);
            }
            else {
                this.addExtendInterfaces(interfaces, parentRef);
            }
        }
        (item.fields || []).forEach(element => {
            this.lookupFieldDefiniton(element, parentRef, mode);
        });
    }
    lookupFieldDefiniton(item, parentRef, mode) {
        switch (item.kind) {
            case 'FieldDefinition':
            case 'InputValueDefinition':
                return this.lookupField(item, parentRef, mode);
        }
    }
    lookupField(item, parentRef, mode) {
        const propertyName = lodash_1.get(item, 'name.value');
        if (!propertyName) {
            return;
        }
        const isFunction = (item.arguments &&
            !lodash_1.isEmpty(item.arguments)) ||
            this.isRoot(parentRef.getName());
        const { name: type, required } = this.getFieldTypeDefinition(item.type);
        if (!isFunction) {
            parentRef.addProperty({
                name: propertyName,
                type,
                hasQuestionToken: !required,
            });
            return;
        }
        parentRef.addMethod({
            isAbstract: mode === 'class',
            name: propertyName,
            returnType: `${type} | Promise<${type}>`,
            parameters: this.getFunctionParameters(item.arguments),
        });
    }
    getFieldTypeDefinition(type) {
        const { required, type: nestedType } = this.getNestedType(type);
        type = nestedType;
        const isArray = type.kind === 'ListType';
        if (isArray) {
            const { required, type: nestedType } = this.getNestedType(lodash_1.get(type, 'type'));
            type = nestedType;
            const typeName = lodash_1.get(type, 'name.value');
            return {
                name: this.getType(typeName) + '[]',
                required,
            };
        }
        const typeName = lodash_1.get(type, 'name.value');
        return {
            name: this.getType(typeName),
            required,
        };
    }
    getNestedType(type) {
        const isNonNullType = type.kind === 'NonNullType';
        if (isNonNullType) {
            return {
                type: this.getNestedType(lodash_1.get(type, 'type')).type,
                required: isNonNullType,
            };
        }
        return { type, required: false };
    }
    getType(typeName) {
        const defaults = this.getDefaultTypes();
        const isDefault = defaults[typeName];
        return isDefault ? defaults[typeName] : typeName;
    }
    getDefaultTypes() {
        return {
            String: 'string',
            Int: 'number',
            Boolean: 'boolean',
            ID: 'string',
            Float: 'number',
        };
    }
    getFunctionParameters(inputs) {
        if (!inputs) {
            return [];
        }
        return inputs.map(element => {
            const { name, required } = this.getFieldTypeDefinition(element.type);
            return {
                name: lodash_1.get(element, 'name.value'),
                type: name,
                hasQuestionToken: !required,
            };
        });
    }
    addScalarDefinition(item, tsFile) {
        const name = lodash_1.get(item, 'name.value');
        if (!name) {
            return;
        }
        tsFile.addTypeAlias({
            name,
            type: 'any',
            isExported: true,
        });
    }
    addExtendInterfaces(interfaces, parentRef) {
        if (!interfaces) {
            return;
        }
        interfaces.forEach(element => {
            const interfaceName = lodash_1.get(element, 'name.value');
            if (interfaceName) {
                parentRef.addExtends(interfaceName);
            }
        });
    }
    addImplementsInterfaces(interfaces, parentRef) {
        if (!interfaces) {
            return;
        }
        interfaces.forEach(element => {
            const interfaceName = lodash_1.get(element, 'name.value');
            if (interfaceName) {
                parentRef.addImplements(interfaceName);
            }
        });
    }
    addEnumDefinition(item, tsFile) {
        const name = lodash_1.get(item, 'name.value');
        if (!name) {
            return;
        }
        const members = lodash_1.map(item.values, value => ({
            name: lodash_1.get(value, 'name.value'),
            value: lodash_1.get(value, 'name.value'),
        }));
        tsFile.addEnum({
            name,
            members,
            isExported: true,
        });
    }
    addUnionDefinition(item, tsFile) {
        const name = lodash_1.get(item, 'name.value');
        if (!name) {
            return;
        }
        const types = lodash_1.map(item.types, value => lodash_1.get(value, 'name.value'));
        tsFile.addTypeAlias({
            name,
            type: types.join(' | '),
            isExported: true,
        });
    }
    addSymbolIfRoot(name) {
        return this.root.indexOf(name) >= 0 ? `I${name}` : name;
    }
    isRoot(name) {
        return ['IQuery', 'IMutation', 'ISubscription'].indexOf(name) >= 0;
    }
    addClassOrInterface(tsFile, mode, options) {
        return mode === 'class'
            ? tsFile.addClass(options)
            : tsFile.addInterface(options);
    }
    getClassOrInterface(tsFile, mode, name) {
        return mode === 'class' ? tsFile.getClass(name) : tsFile.getInterface(name);
    }
};
GraphQLAstExplorer = __decorate([
    common_1.Injectable()
], GraphQLAstExplorer);
exports.GraphQLAstExplorer = GraphQLAstExplorer;
