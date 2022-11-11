import { clusterApiUrl, Connection } from "@solana/web3.js"
import { getNameRecordFromDomainTld, getOwnerFromDomainTld } from "../src";


const connection = new Connection(clusterApiUrl('devnet'));

getNameRecordFromDomainTld(connection, '123456.test123')