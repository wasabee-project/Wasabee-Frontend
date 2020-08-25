// minimal
import WasabeeOp from "./operation";

export function getSelectedOperation() {
  return null;
}

export function removeOperation(opID) {
  delete localStorage[opID];
}

export function getOperationByID(opID) {
  const raw = localStorage[opID];
  if (raw == null) return null;
  return new WasabeeOp(raw);
}
