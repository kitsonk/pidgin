#!/bin/sh

node_modules/stylus/bin/stylus --compress themes/claro/base.styl --include node_modules/nib/lib
node_modules/stylus/bin/stylus --compress themes/flatwhite/base.styl --include node_modules/nib/lib
