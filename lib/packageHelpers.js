
export const packageFilter = (packagePattern) => ([name], _pkgObj) => {
  // TODO support NOT matching via "!" prefixed patterns
  // TODO support multiple comma separated patterns
  // TODO support exact matching
  // TODO just support some sort of query language to drill down packages
  /**
   *    "@redhat" should match all packages starting with this term ("@" has no significants)
   *    "!@redhat" should match all packages not starting with this term
   *    "~@redhat" should match all packages containing the term (this can also be negated with "!" at the start
   *    "$@redhat" should match all packages ending with the term
   *    "=@patternfly/react-core" should match the package exactly matching
   *    "@redhat=major" should match all package updates that are starting with the term and are major updates (other levels should work too)
   */
  return name.startsWith(packagePattern);
};

export const filteredPackages = (packages, pattern) => {
  const pkgs = Object.entries(packages);
  return pattern ? pkgs.filter(packageFilter(pattern)) : pkgs;
};
