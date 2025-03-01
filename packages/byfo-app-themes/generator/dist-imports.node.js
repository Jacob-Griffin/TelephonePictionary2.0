import module from 'module';
module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.?\.\//.test(specifier) && !specifier.endsWith('.js')) {
      return nextResolve(specifier + '.js', context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    return nextLoad(url, context);
  },
});
