import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory, hashHistory } from 'react-router';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createLogger from 'redux-logger';
import { syncHistoryWithStore, routerReducer, routerMiddleware } from 'react-router-redux';
import injectTapEventPlugin from 'react-tap-event-plugin';
import { reducer as formReducer } from 'redux-form';
import thunk from 'redux-thunk';
import * as reducers from './reducers';
import getRoutes from './routes';
import StorageService from '../services/StorageService';
import migrate from './migrations';


injectTapEventPlugin();

const middleware = [thunk, routerMiddleware(browserHistory)];
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}
async function init() {
  let savedState = await StorageService.getOrCreateState();
  savedState = migrate(savedState);
  const appReducer = combineReducers(Object.assign({}, reducers, {
    routing: routerReducer,
    form: formReducer,
  }));

  const rootReducer = (state, action) => {
    if (action.type === 'PROFILE_CHANGE') {
      return appReducer(undefined, action);
    }
    return appReducer(state, action);
  };
  const store = createStore(rootReducer, savedState, applyMiddleware(...middleware));

// Save state in localStorage automatically
  store.subscribe(async () => {
    const state = store.getState();
    if (state) {
      await StorageService.saveState({ menu: state.menu, profiles: state.profiles, atc: state.atc });
    }
  });

  const history = syncHistoryWithStore(hashHistory, store);

  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        {getRoutes(store)}
      </Router>
    </Provider>,
    document.getElementById('app'),
  );
}

init();
