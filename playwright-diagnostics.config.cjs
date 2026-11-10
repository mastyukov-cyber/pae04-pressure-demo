'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./qa',testMatch:'diagnostics-demo.spec.cjs',
 timeout:30000,expect:{timeout:7000},retries:0,workers:1,
 use:{
   browserName:'webkit',headless:true,
   screenshot:'only-on-failure',trace:'off',video:'off',
   serviceWorkers:'block',
 },
 webServer:{
   command:'node qa/diagnostics-demo-server.cjs',
   url:'http://127.0.0.1:4173/diagnostics/demo/',
   timeout:15000,reuseExistingServer:false,
 },
 outputDir:'diagnostics-test-results',
 reporter:[['line']]
});
