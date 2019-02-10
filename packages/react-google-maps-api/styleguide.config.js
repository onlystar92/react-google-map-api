const path = require('path')

module.exports = {
  ignore: ['**/*.js', '**/*.ts', '**/src/components/drawing/Data.tsx'],
  propsParser: require('react-docgen-typescript').withDefaultConfig().parse,
  getComponentPathLine (componentPath) {
    const name = path.basename(componentPath, '.tsx')
    return `import { ${name} } from '@react-google-maps/api';`
  },
  showUsage: true,
  webpackConfig: {
    module: {
      rules: [
        {
          test: /\.ts|\.tsx$/,
          loader: 'awesome-typescript-loader'
        },
      ]
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    }
  },
  sections: [
    {
      name: 'Introduction',
      content: 'src/docs/introduction.md',
    },
    {
      name: 'Getting Started',
      content: 'src/docs/getting-started.md'
    },
    {
      name: 'Components',
      components: ['src/LoadScript.tsx', 'src/GoogleMap.tsx', 'src/components/**/*.tsx'],
    },
  ],
}
