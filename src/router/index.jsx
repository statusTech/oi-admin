import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../components/layout/Dashboard';

export default () => (
  <Router>
    <Switch>
      <Route path='/login' component={Login} />
      <Route path='/dashboard' component={Dashboard} />
      <Redirect from='/' to='/login' />
    </Switch>
  </Router>
);
