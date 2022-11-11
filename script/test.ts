import { clusterApiUrl, Connection } from "@solana/web3.js"
import { getNameRecordFromDomainTld, getOwnerFromDomainTld } from "../src";


const connection = new Connection(clusterApiUrl('devnet'));

async function test1() {
    const nameRecord = await getNameRecordFromDomainTld(connection, '123.xnft')
    console.log(nameRecord.pretty())
}

test1()