// minimal
import WasabeeOp from "./operation";

export function getSelectedOperation() {
  return null;
}

export function removeOperation(opID) {
  delete localStorage[opID];
}

export function getOperationByID(opID) {
  return new WasabeeOp(localStorage[opID]);
}
