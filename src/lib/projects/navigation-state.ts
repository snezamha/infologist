export type ProjectNavigationState = {
  features: {
    mediaManagement: boolean;
    statistics: boolean;
    aiAssistant: boolean;
    pageBuilder: boolean;
  };
  modules: Array<{
    key: string;
    title: {
      en: string;
      fa: string;
      de: string;
    };
  }>;
};
