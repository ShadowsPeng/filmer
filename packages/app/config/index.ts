/**
 * Taro 编译配置。
 */
import { defineConfig } from '@tarojs/cli'
import { WeappConfig } from './dev'

export default defineConfig(async (ctx) => {
  return {
    projectName: 'filmer',
    date: new Date().toISOString(),
    designWidth: 750,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 828: 1.81 / 2, 375: 2 / 1 },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react', '@tarojs/plugin-platform-weapp'],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: true },
    sass: { resource: [] },
    mini: WeappConfig,
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: { filename: 'js/[name].[hash:8].js', chunkFilename: 'js/[name].[chunkhash:8].js' },
      miniCssExtract: { ignoreOrder: true, filename: 'css/[name].[hash].css' },
      postcss: { autoprefixer: { enable: true } },
      devServer: { port: 10086, host: '0.0.0.0' },
    },
  } as any
})
