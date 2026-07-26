/**
 * 微信小程序全局配置:pages / window / tabBar
 */
export default {
  pages: [
    'pages/index/index',
    'pages/scan/list',
    'pages/scan/detail',
    'pages/order/confirm',
    'pages/order/result',
    'pages/order-detail/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#141210',
    navigationBarTitleText: 'Filmer',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0D0B09',
  },
  tabBar: {
    color: '#9A9080',
    selectedColor: '#C9A96E',
    backgroundColor: '#141210',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '发现',
        iconPath: '',
        selectedIconPath: '',
      },
      {
        pagePath: 'pages/scan/list',
        text: '冲扫',
        iconPath: '',
        selectedIconPath: '',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: '',
        selectedIconPath: '',
      },
    ],
  },
  style: 'v2',
  sitemap: { rules: [{ action: 'allow', page: '*' }] },
  lazyCodeLoading: 'requiredComponents',
}
