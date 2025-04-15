export const filesToMonitor = [
    {
      path: 'data/services/insights/example/deploy.yml', //This is the path to your repo in app-interface
      githubRepo: 'https://github.com/RedHatInsights/EXAMPLE_APP', //
      workflowTrigger: 'workflow_dispatch', // Sent to github in a payload
      appName: 'example-frontend', // appName is the appName in app-interace
      workflowFileName: 'webpack.yml' // workflowFileName is the file where the sentry workflow resides
    },
    // Add more apps here...
  ];
  
  