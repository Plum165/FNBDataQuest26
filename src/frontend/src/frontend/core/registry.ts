import React from 'react';

export interface ModuleMetadata {
  name: string;
  icon: string; // Describes Lucide icon key name
  description: string;
  route: string;
}

export interface ModuleExports {
  MODULE?: ModuleMetadata;
  default: React.ComponentType<{ context: any }>;
}

export interface RegisteredModule {
  route: string;
  metadata: ModuleMetadata;
  component: React.ComponentType<{ context: any }>;
}

export class ModuleRegistry {
  private static registeredModules: Map<string, RegisteredModule> = new Map();

  static scan(): RegisteredModule[] {
    this.registeredModules.clear();

    // Scan all index.tsx and config.json inside modules directory dynamically at build/dev time using Vite's eager glob imports
    const modulesRaw = (import.meta as any).glob('/src/frontend/modules/*/index.tsx', { eager: true }) as Record<string, any>;
    const configsRaw = (import.meta as any).glob('/src/frontend/modules/*/config.json', { eager: true }) as Record<string, any>;

    const keys = Object.keys(modulesRaw);

    // Apply strict sorting layout so critical banking views appear in correct sequence before extra custom components
    const priorityOrder = [
      'overview',
      'research',
      'data_quality',
      'univariate',
      'bivariate',
      'woe_iv',
      'feature_engineering',
      'logistic_regression',
      'classification_trees',
      'model_evaluation',
      'scorecard_points',
      'business_dashboard',
      'ai_reflection'
    ];
    
    keys.sort((a, b) => {
      const folderA = a.split('/').slice(-2, -1)[0];
      const folderB = b.split('/').slice(-2, -1)[0];
      const idxA = priorityOrder.indexOf(folderA);
      const idxB = priorityOrder.indexOf(folderB);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return folderA.localeCompare(folderB);
    });

    for (const path of keys) {
      const segments = path.split('/');
      const folderName = segments[segments.length - 2];
      
      const configPath = `/src/frontend/modules/${folderName}/config.json`;
      const configJson = configsRaw[configPath] ? (configsRaw[configPath].default || configsRaw[configPath]) : undefined;
      const modExports = modulesRaw[path] as ModuleExports;

      if (modExports && modExports.default) {
        // Fallback default in case of missing files to ensure robust operations
        const metadata: ModuleMetadata = {
          name: configJson?.name || modExports.MODULE?.name || folderName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          icon: configJson?.icon || modExports.MODULE?.icon || 'Layers',
          description: configJson?.description || modExports.MODULE?.description || 'Simulated analysis suite segment.',
          route: configJson?.route || modExports.MODULE?.route || `/${folderName}`
        };

        this.registeredModules.set(metadata.route, {
          route: metadata.route,
          metadata,
          component: modExports.default
        });
      }
    }

    return Array.from(this.registeredModules.values());
  }

  static getModules(): RegisteredModule[] {
    if (this.registeredModules.size === 0) {
      return this.scan();
    }
    return Array.from(this.registeredModules.values());
  }
}
