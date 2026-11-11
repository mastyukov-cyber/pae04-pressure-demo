'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./qa',
 testMatch:'connection.spec.cjs',
 timeout:30000,
 expect:{timeout:7000},
 retries:0,
 workers:1,
 use:{
   browserName:'webkit',headless:true,screenshot:'only-on-failure',
   trace:'off',video:'off',serviceWorkers:'block',
 },
 webServer:{
   command:'node qa/connection-server.cjs',
   url:'http://127.0.0.1:4175/diagnostics/connection/',
   timeout:15000,
   reuseExistingServer:false,
 },
 outputDir:'connection-test-results',
 reporter:[['line']],
});
