import { createApp } from 'vue';
import App from './App.vue';

import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import './style.css';

import vuetify from './plugins/vuetify';
import { i18n } from './plugins/i18n';

const app = createApp(App);

app.use(vuetify);
app.use(i18n);
app.mount('#app');
