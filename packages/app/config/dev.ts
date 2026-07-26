/**
 * 微信小程序 dev 配置。
 */
export const WeappConfig = {
  appid: 'touristappid',
  compileType: 'miniprogram',
  miniprogramRoot: 'dist/',
  projectname: 'filmer',
  setting: {
    urlCheck: false,           // 本地调试关掉合法域名校验
    es6: true,
    postcss: true,
    minified: true,
    newFeature: true,
    autoAudits: false,
  },
}
