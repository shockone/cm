'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });


  it('should automatically redirect to /management when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/management");
  });


  describe('management', function() {

    beforeEach(function() {
      browser().navigateTo('#/management');
    });


    it('should render management when user navigates to /management', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/Phones/);
    });

  });


  describe('selection', function() {

    beforeEach(function() {
      browser().navigateTo('#/selection');
    });


    it('should render selection when user navigates to /selection', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/Send Email/);
    });

  });
});
