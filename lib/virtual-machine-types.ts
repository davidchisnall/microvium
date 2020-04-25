import * as IL from './il';
import { assert, stringifyIdentifier, assertUnreachable, entries, notUndefined, unexpected } from './utils';
import { isUInt16 } from './runtime-types';
import { VirtualMachine } from './virtual-machine';

export type GlobalSlotID = string;

export type PropertyKey = string;
export type Index = number;

export type ResolveFFIImport = (hostFunctionID: IL.HostFunctionID) => HostFunctionHandler;

export type ModuleResolver = (moduleSpecifier: ModuleSpecifier) => ModuleObject;

export type ModuleObject = IL.ReferenceValue<IL.ObjectAllocation> | IL.EphemeralObjectValue;

export type ModuleSpecifier = string;

export type Frame = InternalFrame | ExternalFrame;

export interface InternalFrame {
  type: 'InternalFrame';
  args: IL.Value[];
  block: IL.Block;
  callerFrame: Frame | undefined;
  filename: string;
  func: Function;
  nextOperationIndex: number;
  object: IL.ReferenceValue<IL.ObjectAllocation> | IL.EphemeralObjectValue | IL.UndefinedValue;
  operationBeingExecuted: IL.Operation;
  variables: IL.Value[];
}

// Indicates where control came from external code
export interface ExternalFrame {
  type: 'ExternalFrame';
  callerFrame: Frame | undefined;
  result: IL.Value;
}

export interface VirtualMachineOptions {
  // Function called before every operation
  trace?: (operation: IL.Operation) => void;
}

export interface GlobalDefinitions {
  [name: string]: GlobalDefinition;
}

export type GlobalDefinition = (vm: VirtualMachine) => Handle<IL.Value>;

export type MetaID<T = any> = number;

export interface GlobalSlot {
  value: IL.Value;
  indexHint?: number; // Lower indexes are accessed more efficiently in the the C VM
}

export type HostFunctionHandler = (object: IL.Value, args: IL.Value[]) => IL.Value | void;

export interface HostObjectHandler {
  get(obj: IL.Value, key: PropertyKey | Index): IL.Value;
  set(obj: IL.Value, key: PropertyKey | Index, value: IL.Value): void;
}

// Handles are used when we want to reference-count a value rather than expose
// it to the GC. Generally, `Handle<T>` means that the variable holds ownership.
export interface Handle<T extends IL.Value = IL.Value> {
  value: T;
  addRef(): Handle<T>;
  release(): T;
}

export interface Function extends IL.Function {
  moduleHostContext: any; // Provided by the host when the module is loaded
}