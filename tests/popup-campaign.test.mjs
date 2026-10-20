import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_POPUP_CAMPAIGN, parsePopupCampaign } from '../lib/popup-campaign.ts';

test('campaign preserves the supplied voting destinations', () => {
  const result = parsePopupCampaign(DEFAULT_POPUP_CAMPAIGN);
  assert.equal(result.voteUrl, 'https://www.binance.com/zh-CN/square/blockchain-100-2026?username=456');
  assert.equal(result.profileUrl, 'https://www.binance.com/zh-CN/square/profile/wiseinvest');
  assert.equal(result.sites.length, 9);
});
test('public config cannot carry executable links or credentials', () => {
  for (const voteUrl of ['javascript:alert(1)', 'data:text/html,x', 'http://example.com', 'https://user:password@example.com', '/relative']) {
    assert.throws(() => parsePopupCampaign({ ...DEFAULT_POPUP_CAMPAIGN, voteUrl }));
  }
});
test('disable state persists and unknown private fields are removed', () => {
  const result = parsePopupCampaign({ ...DEFAULT_POPUP_CAMPAIGN, enabled: false, secret: 'not-public', intervalHours: 2 });
  assert.equal(result.enabled, false);
  assert.equal('secret' in result, false);
  assert.equal('intervalHours' in result, false);
});
test('invalid sites, overly long text and invalid states are rejected', () => {
  for (const override of [{ sites: ['unknown'] }, { enabled: 'true' }, { title: '' }, { title: 'a'.repeat(61) }, { sites: null }]) {
    assert.throws(() => parsePopupCampaign({ ...DEFAULT_POPUP_CAMPAIGN, ...override }));
  }
  assert.deepEqual(parsePopupCampaign({ ...DEFAULT_POPUP_CAMPAIGN, sites: ['main', 'main'] }).sites, ['main']);
});
