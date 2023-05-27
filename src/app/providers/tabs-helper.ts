import { Routes } from '@angular/router';
import { snake2Pascal } from './helper';

export function generateTabModule(name: string, childrens: any[] = null): any {
  const moduleObject = {
    path: name,
    children: [
      {
        path: '',
        loadChildren: () => import('../pages/' + name + '/' + name + '.module').then(m => m[snake2Pascal(name) + 'Module'])
      }
    ]
  };
  if (childrens && Array.isArray(childrens) && childrens.length && childrens[0] != 'section') {
    for (const child of childrens) {
      if (child[0] === '') {
        moduleObject.children = [];
        break;
      }
    }
    for (const child of childrens) {
      const childModule = {
        path: child[0],
        loadChildren: () => import('../pages/' + child[1] + '/' + child[1] + '.module').then(m => m[snake2Pascal(child[1]) + 'Module'])
      };
      moduleObject.children.push(childModule);
    }
  }
  return moduleObject;
}

export function generateRouteModule(name: string, pathName = null, moduleName = null): any {
  const pName = pathName ? pathName : name;
  const mName = moduleName ? moduleName : pName;
  const path = '../pages/';
  const moduleObject = {
    path: name,
    loadChildren: () => import('../pages/' + pName + '/' + pName + '.module').then(m => m[snake2Pascal(mName) + 'Module'])
  };
  return {
    path: 'login',
    loadChildren: () => import(path + 'login/login.module').then(m => m.LoginModule)
  };
  //return moduleObject;
}


export function generateTabModules(modulePaths: any[]): Routes {
  const tabChildrenModules: any[] =
    [
      {
        path: '',
        redirectTo: '/app/tabs/home',
        pathMatch: 'full'
      }
    ];
  for (const mod of modulePaths) {
    let isList = false;
    for (const ins of mod) {
      if (ins && ins.length && (ins[0] == 'list' || ins[0] == 'published' || ins[0] == 'in-approval')) {
        isList = true;
        break;
      }
    }
    if (isList) {
      continue;
    }
    tabChildrenModules.push(generateTabModule(mod[0], Array.isArray(mod) && mod.length > 1 ? mod[1] : null));
  }
  const tabsModule: Routes = [
    {
      path: 'tabs',
      children: tabChildrenModules
    }
  ];
  return tabsModule;
}

export function generateRouteModules(modulePaths: any[]): Routes {
  const routesModule: Routes = [];
  for (const mod of modulePaths) {
    const pathName = mod.length > 1 ? mod[1] : null;
    const moduleName = mod.length > 2 ? mod[2] : null;
    routesModule.push(generateRouteModule(mod[0], pathName, moduleName));
  }
  return routesModule;
}
