const { salesOrderReplicateFlow } = require('./salesOrderReplicate');

const replicateFlowsByActionId = {
  [salesOrderReplicateFlow.actionId]: salesOrderReplicateFlow
};

module.exports = {
  replicateFlowsByActionId
};
