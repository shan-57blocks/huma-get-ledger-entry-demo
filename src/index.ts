import { Address, SorobanRpc, xdr } from '@stellar/stellar-sdk';

(async () => {
  const getLedgerKeySymbol = (contractId: string, symbolText: string) => {
    const ledgerKey = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: new Address(contractId).toScAddress(),
        key: xdr.ScVal.scvSymbol(symbolText),
        durability: xdr.ContractDataDurability.persistent()
      })
    );
    return ledgerKey;
  };

  const incrementContract =
    'CCVRLKWWSYYFAEOCMLH5BT5B3SWCJSO6SMB5S3LOZ5BMKE6D6PTCXJRL';
  const COUNTER_SYMBOL = 'COUNTER';
  const keys = getLedgerKeySymbol(incrementContract, COUNTER_SYMBOL);

  const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
  const entries = await server.getLedgerEntries(keys);
  console.log(entries);
})();
