module.exports = {
  apps : [
      {
        name: "webserver",
        script: "./week10.js",
        watch: true,
        env: {
          "NODE_ENV": "development",
        }
      },
      {
        name: "sensorwrite",
        script: "./week09/week09.js",
        watch: true,
        env: {
            "NODE_ENV": "development",
            "PHOTON_ID": "2a0026001347343438323536",
            "PHOTON_TOKEN": "9f4478a2980411b480f9c466a406cf675a9e7639",
            "AWSRDS_EP": "shies425.clxc3kpd4jpj.us-east-1.rds.amazonaws.com",
            "AWSRDS_PW": "D4t4V1z\!",
        }
      }
  ]
}