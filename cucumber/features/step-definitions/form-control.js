const { Given, Then } = require('cucumber');    
const { expect } = require('chai');

Given('navigate to the {string} page', function (string) {
	return this.menuNavigate(string).then(() => {
		return this.getPageTitle().then((title) => {
			return expect(title).to.equal(string);
		}).catch((e) => {
			throw e;
		});
	}).catch((e) => {
		throw e;
	})
});

Then('the {string} field with id {string} will have an identified label', function (string, string2) {
	return this.findInputField(string, string2).then((fieldResult) => {
		return this.findInputLabel(string2).then((labelResult) => {
			return expect(fieldResult).to.equal(labelResult);
		}).catch((e) => {
			throw e;
		});
	}).catch((e) => {
		throw e;
	});
});

Then('the label {string} will read {string}', function (string, string2) {
	return this.getLabelText(string).then((result) => {
		return expect(string2).to.equal(result);
	}).catch((e) => { throw e; });
});

Then('when {string} with id {string} is populated with {string} then the result will be {string}', function (elemType, fieldId, value, message) {
	return this.setInputText(elemType, fieldId, value).then((el) => {
		return this.submitButton('home-submit').then((el) => {
			return this.getInputErrorMessage(elemType, fieldId, message).then((result) => {
				return expect(result).to.equal(message);
			}).catch((e) => {
 				throw e;
			});
		}). catch((e) => {
			throw e;
		});
	}).catch((e) => {
		throw e;
	});
});