const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.local.findFirst({where:{origenImportacion:'GOOGLE_PLACES'},select:{ciudad:true,comuna:true,nombre:true}}).then(r=>{console.log(JSON.stringify(r,null,2));p.$disconnect()})
