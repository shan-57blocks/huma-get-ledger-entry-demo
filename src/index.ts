import {
  Address,
  BASE_FEE,
  Keypair,
  Networks,
  Operation,
  SorobanDataBuilder,
  SorobanRpc,
  TransactionBuilder,
  xdr
} from '@stellar/stellar-sdk';

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

const extendTTL = async (
  ledgerKeys: xdr.LedgerKey,
  server: SorobanRpc.Server
) => {
  const signer = Keypair.fromSecret(
    'SCS43KPAQZ2J22DYMAFJQVFTPWZQ6RBYL332PEBCPBJ6ZHAF3PMR2VLC'
  );
  const account = await server.getAccount(signer.publicKey());
  const tx = new TransactionBuilder(account, { fee: BASE_FEE })
    .setNetworkPassphrase(Networks.TESTNET)
    .setSorobanData(new SorobanDataBuilder().setReadWrite([ledgerKeys]).build())
    .addOperation(
      Operation.extendFootprintTtl({
        extendTo: 3110400 - 1
      })
    )
    .setTimeout(30)
    .build();

  const preparedTransaction = await server.prepareTransaction(tx);
  const simRes = await server.simulateTransaction(preparedTransaction);
  console.log('Simulation result', JSON.stringify(simRes));
  console.log('****************');
  console.log('****************');
  preparedTransaction.sign(signer);

  const sendResponse = await server.sendTransaction(preparedTransaction);
  if (sendResponse.status === 'PENDING') {
    let getResponse = await server.getTransaction(sendResponse.hash);
    while (getResponse.status === 'NOT_FOUND') {
      console.log('Extend TTL Pending...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
    }

    if (getResponse.status === 'SUCCESS') {
      if (!getResponse.resultMetaXdr) {
        throw 'Empty resultMetaXDR in getTransaction response';
      }
      const transactionMeta = getResponse.resultMetaXdr;
      console.log('success');
      console.log(transactionMeta.v3().sorobanMeta().returnValue());
    } else {
      throw getResponse.resultXdr;
    }
  } else {
    throw sendResponse.errorResult;
  }
};

(async () => {
  const incrementContract =
    'CDEFDSU2W56KZW7K226JDQGPZIGEN2NZIDCRR4T34DKNMALEUWCIRJBL';
  const COUNTER_SYMBOL = 'COUNTER';
  const ledgerKeys = getLedgerKeySymbol(incrementContract, COUNTER_SYMBOL);
  const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');

  const entriesBeforeExtend = await server.getLedgerEntries(ledgerKeys);
  console.log('COUNTER entries before extend TTL: ', entriesBeforeExtend);
  console.log('****************');
  console.log('****************');

  await extendTTL(ledgerKeys, server);

  const entriesAfterExtend = await server.getLedgerEntries(ledgerKeys);
  console.log('****************');
  console.log('****************');
  console.log('COUNTER entries after extend TTL: ', entriesAfterExtend);
})();
