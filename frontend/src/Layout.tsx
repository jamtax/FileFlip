import React from 'react';
import { Content, Theme } from '@carbon/react';
// import Header from './Header'; // Uncomment this line if Header.tsx exists in the same folder
import styles from './Layout.module.css';
interface Props {
  // Represents the child elements or components to be rendered within the Layout.
  children: React.ReactNode;
}
// The Layout component serves as the main wrapper for the application's content,
// providing consistent theming and structure across pages.
const Layout: React.FC<Props> = ({ children }) => (
  <Theme theme="g100">
    {/* <Header /> */}
    <Content className="min-h-screen bg-carbon-gray-10 px-4">{children}</Content>
    <Content className={styles.content}>{children}</Content>
  </Theme>
);

export default Layout;
