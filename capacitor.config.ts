import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.drraaz.myartstudio',
  appName: 'My Art Studio',
  webDir: 'dist',
  backgroundColor: '#faf8ff',
  android: {
    allowMixedContent: false,
  },
};

export default config;
