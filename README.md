# metix_automation_handout

## Installation

Make sure you have the latest version of node, or at least >= 8 for the async features.

Make sure you have the latest versions of chrome and firefox, this is needed for headless execution of tests.

Optional: It's handy to have grunt installed globally

git clone this repository

npm install 

## Running the test suite

npm run testServerChrome
npm run testServerFireFox

Results dashboard will open automatically at the end of the tests.

## NPM Commands

npm run ...

#### start

This command starts an express server to statically serve the sample website

#### testChrome or testFireFox

This command runs the cucumber test framework, each command runs the specified browser.

N.B. Not much use without the server running, see next command.

#### testServerChrome or testServerFireFox

This command uses the concurrently package to run the server and then run the test framework. Each command runs the specified browser, via grunt tasks in order to create log folder if it does not exist and rename the log file with a timestamp.

## Grunt Commands

grunt ...

#### buildDashboard

The dashboard to report on test results is developed using react. It requires a build process, see docs/framework_design_considerations.md for more details.

This command builds the dashboard, copies any existing test result json files into the public directory then runs express to serve the pages and finally loads the dashboard in chrome.

#### runDashboard

This command will run the dashboard. The built dashboard project is included in this repository, so really there is no need to do a build, just run the dashboard to review test results. This is also done at the end of a test run, so the dashboard with the latest results will open automatically. It's defaulted to chrome as a browser.

## Dependencies

#### NodeJS v8+

The latest selenium webdriver package requires v8 or above in order to use the asyc function.

Details of the issue are here: https://stackoverflow.com/questions/48542631/syntaxerror-unexpected-identifier-in-selenium-webdriver-lib-http-js454-async-e

#### NVM (Node Version Manager)

In case its needed.

https://danielarancibia.wordpress.com/2017/03/28/install-or-upgrade-nodejs-with-nvm-for-windows/
https://github.com/coreybutler/nvm-windows/releases

Run:

nvm install latest
nvm use 9.10.1

#### Grunt

This is in the package.json dependencies, however it is useful to install it globally.

npm install -g grunt

## Git Ignore

For this project, I have included the test result folders in the git ignore. These results are generated when you run the test framework.

I have not included the dashboard public/build directory in gitignore, though a build usually would be. For the purposes of the technical challenge I felt it was a small enough component to just include and it would make your, the end user, experience easier.