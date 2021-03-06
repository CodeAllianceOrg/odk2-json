import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelcase'

const pkg = require('./package.json')

const libraryName = 'odk-format-converter'

export default {
    entry: `compiled/${libraryName}.js`,
    targets: [
        { dest: pkg.main, moduleName: camelCase(libraryName), format: 'umd' },
        { dest: pkg.module, format: 'es' },
    ],
    sourcemap: true,
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
        include: 'compiled/**',
    },
    plugins: [
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs({
            namedExports: {
                'node_modules/xlsx/xlsx.js': [ 'utils', 'write', 'read' ]
            }
        }),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve(),

        // Resolve source maps to the original source
        sourceMaps(),
    ],
}
