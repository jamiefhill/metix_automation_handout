module.exports = function(grunt) {

    grunt.initConfig({

        env: {
            chrome: {
                BROWSER: 'chrome'
            },
            firefox: {
                BROWSER: 'firefox'
            },
            dashboard: {
                NODE_ENV: 'development',
                BABEL_ENV: 'development'
            }
        },

        open : {
            dashboard : {
              path: 'http://localhost:3001/index.html',
              app: 'Chrome'
            }
        },

        clean: {
            dashboard: ['./cucumber/dashboard/public'],
            testLogs: ['./cucumber/dashboard/public/logs']
        },

        copy: {
            dashboardResource: {
                files: [{
                    expand: true, 
                    src: ['./cucumber/dashboard/resource/*'], 
                    dest: './cucumber/dashboard/public/', 
                    flatten: true, 
                    filter: 'isFile'
                }]
            },
            dashboardDuplicateLogs: {
                files: [{
                    flatten: true,
                    expand: true,
                    src: ['./cucumber/logs/*'], 
                    dest: './cucumber/dashboard/public/logs/',
                    filter: 'isFile'
                }]
            },
            renameLog: {
                files: [{
                    expand: true,
                    src: ['cucumber/logs/cucumber.json'],
                    dest: 'cucumber/logs/', 
                    filter: 'isFile',
                    rename: function(dest, src) {
                        const currDate = new Date;
                        return dest + 'cucumber_' + process.env.BROWSER + '_' + currDate.getTime() + '.json';
                    }
                }]
            }
        },

        mkdir: {
            logging: {
                options: {
                    create: ['cucumber/logs'],
                },
            },
            publicLogs: {
                options: {
                    create: ['cucumber/dashboard/public/logs/'],
                },
            },
        },

        concat_css: {
            dashboard: {
                src: ["cucumber/dashboard/src/**/*.css"],
                dest: "cucumber/dashboard/public/app.css"
            },
        },

        browserify: {
              dashboard: {
                options: {
                  debug: false,
                  transform: [ [ 'babelify', { "presets": ["react-app"] } ], [ 'browserify-css' ] ]
                },
                files: {
                  './cucumber/dashboard/public/app.js': './cucumber/dashboard/src/**/*.js'
                }
            }
        },

        express: {
            dashboard: {
                options: {
                    script: './cucumber/dashboard/server.js',
                    nospawn: true,
                    delay: 5
                }
            }
        },        

        watch: {
            dashboard: {
                files: ['./cucumber/logs/**/*.json'],
                tasks: ['express:dashboard'],
                options: {
                    nospawn: true
                }   
            }            
        },

        exec: {
                chrome: 'npm run testChrome',
                firefox: 'npm run testFireFox'
            }
    });

    grunt.registerTask('testChrome', function(arg) {
        grunt.task.run('beforeTest', 'env:chrome', 'exec:chrome', 'afterTest');
    });

    grunt.registerTask('testFireFox', function(arg) {
        grunt.task.run('beforeTest', 'env:firefox', 'exec:firefox', 'afterTest');
    });    

    grunt.registerTask('beforeTest', function(arg) {
        grunt.task.run('mkdir:logging', 'generateJSONContentFeature', 'generateGifUsedFeature');
    });

    grunt.registerTask('afterTest', function(arg) {
        grunt.task.run('copy:renameLog', 'deployTestReports', 'runDashboard');
    });    

    grunt.registerTask('runDashboard', function(arg) {
        grunt.task.run('express:dashboard', 'open:dashboard', 'watch:dashboard');
    });    

    grunt.registerTask('deployTestReports', function(arg) {
        grunt.task.run('processTestReports', 'mkdir:publicLogs', 'clean:testLogs', 'copy:dashboardDuplicateLogs');
    });    

    grunt.registerTask('processTestReports', function(arg) {
        grunt.task.run('generateTestReportStats', 'indexTestReports');
    });

    grunt.registerTask('buildDashboard', function(arg) {
        grunt.task.run('clean:dashboard', 'env:dashboard', 'copy:dashboardResource', 'browserify:dashboard', 'concat_css:dashboard', 'deployTestReports', 'runDashboard');
    });    

    grunt.registerTask('indexTestReports', function(arg) {
        const dirList = grunt.file.expand({filter: "isFile", cwd: "cucumber/logs/"}, ["*.json"]);
        let reportArray = [];

        dirList.map(function (t) {
            if(t !== "cucumber.json" && t !== "reportIndex.json") {

                const reportFileStr = grunt.file.read('cucumber/logs/' + t);
                let duration = 0;
                let failed = 0;
                let pass = 0;
                let total = 0;
                let status = 'passed';
                try {
                    let reportJSON = JSON.parse(reportFileStr);
                    if(reportJSON[0].stats) {
                    	total = reportJSON.length;
                        reportJSON.forEach((feature) => {
                            if(feature.stats.status !== 'passed') {
                                status = 'failed';
                                failed++;
                            } else {
                            	pass++;
                            }
                            duration += feature.stats.duration;
                        });
                    } else {
                        grunt.log.write('Stats missing');
                        status = 'failed';
                        duration = 0;
                    }

                    } catch (e) {
                    	grunt.log.write('Error ' + t + '\n');
                        grunt.log.write(e);
                        status = 'failed';
                        duration = 0;
                    }

                let reportFile = '{"filename":"' + t + '",';

                const browser = t.substring(t.indexOf('_') + 1, t.lastIndexOf('_'));

                reportFile += '"browser":"' + browser + '",';

                const timeStamp = t.substring(t.lastIndexOf('_') + 1, t.indexOf('.'));

                reportFile += '"timestamp":"' + timeStamp + '",';
                reportFile += '"status":"' + status + '",';
                reportFile += '"failed":"' + failed + '",';
                reportFile += '"passed":"' + pass + '",';
                reportFile += '"total":"' + total + '",';
                reportFile += '"duration":"' + duration + '"}';

                reportArray.push(JSON.parse(reportFile));
            }
        });
        reportArray = reportArray.sort(function(a, b) { return b.timestamp - a.timestamp });
        grunt.file.write('cucumber/logs/reportIndex.json', '{"reportIndex":' + JSON.stringify(reportArray) + '}');
    });


    grunt.registerTask('generateTestReportStats', function(arg) {
        const dirList = grunt.file.expand({filter: "isFile", cwd: "cucumber/logs/"}, ["*.json"]);

        dirList.map(function (t) {
            if(t !== "cucumber.json" && t !== "reportIndex.json") {

                const reportFile = grunt.file.read('cucumber/logs/' + t);
                try {
                    let reportJSON = JSON.parse(reportFile);

                    //if(!reportJSON[0].stats) {
                        reportJSON.forEach((feature) => {
                            let featureStatus = 'passed';
                            let featureDuration = 0;
                            let scenarioFail = 0;
                            let scenarioPass = 0;
                            feature.elements.forEach((scenario) => {
                                let status = 'passed';
                                let duration = 0;
                                let failed = 0;
                                let pass = 0;
                                scenario.steps.forEach((step) => {
                                    if(step.result.status !== 'passed') {
                                        status = 'failed';
                                        failed++;
                                    } else {
                                    	pass++;
                                    }
                                    if('duration' in step.result) {
                                        duration += step.result.duration;
                                    }
                                });
                                scenario.stats = {};
                                scenario.stats.duration = duration;
                                scenario.stats.status = status;
                                scenario.stats.failed = failed;
                                scenario.stats.passed = pass;
                                scenario.stats.total = scenario.steps.length;
                                if(status !== 'passed') {
                                    featureStatus = 'failed';
                                    scenarioFail++;
                                } else {
                                	scenarioPass++;
                                }
                                featureDuration += duration;
                            });
                          feature.stats = {};
                          feature.stats.status = featureStatus;
                          feature.stats.duration = featureDuration; 
                          feature.stats.failed = scenarioFail;
                          feature.stats.passed = scenarioPass;
                          feature.stats.total = feature.elements.length;
                        });

                        grunt.file.write('cucumber/logs/' + t, JSON.stringify(reportJSON));
                   // }

                } catch(e) {
                	grunt.log.write('Error ' + t + '\n');
                    grunt.log.write(e);
                }

            }
        });
    });    

    grunt.registerTask('generateGifUsedFeature', function(arg) {
        const dirList = grunt.file.expand({filter: "isFile", cwd: "public/resources"}, ["*.gif"]);

    	let featurePlan = 'Feature: Gif Files provided are used.\n\n';

    	featurePlan += 'Scenario: All images should be working\n';
    	featurePlan += 'Given I go to "http://localhost:3000"\n';
    	featurePlan += 'Then I expect to find all images loading\n\n';

    	featurePlan += 'Scenario Outline: Find gif on the site\n';
    	featurePlan += 'Given I go to "http://localhost:3000"\n';
    	featurePlan += 'Then we will find "<gif>" image on one or more of the pages\n'
    	featurePlan += 'Examples:\n';
    	featurePlan += '|gif|\n';

        dirList.map(function (t) {
    		featurePlan += '|' + t + '|\n';
  		});

        grunt.file.write('cucumber/features/GifUsed.feature', featurePlan);
    });   

    grunt.registerTask('generateJSONContentFeature', function(arg) {
        const dummyFile = grunt.file.read('public/dummy-data.json');
        try {
        	let dummyJSON = JSON.parse(dummyFile);
        	let featurePlan = 'Feature: dummy-data json content must be on the site\n\n';
        	featurePlan += 'Scenario Outline: Find content on site\n';
        	featurePlan += 'Given I go to "http://localhost:3000"\n';
        	featurePlan += 'Then we will find "<content>" on one or more of the pages\n'
        	featurePlan += 'Examples:\n';
        	featurePlan += '|content|\n';

  			for (let key in dummyJSON) {
    			let value = dummyJSON[key];
    			for(let paraKey in value) {
    				let paraValue = value[paraKey];
    				featurePlan += '|' + paraValue + '|\n';
    				}
  			}

            grunt.file.write('cucumber/features/JSON-content.feature', featurePlan);

        } catch(e) {
            grunt.log.write(e);
        }
    });    

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-concat-css');

}