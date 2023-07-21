import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { App, Button, Popover } from 'antd';
import classnames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useActionContext } from '../..';
import { useDesignable } from '../../';
import { Icon } from '../../../icon';
import { useRecord } from '../../../record-provider';
import { SortableItem } from '../../common';
import { useCompile, useComponent, useDesigner } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import ActionContainer from './Action.Container';
import { ActionDesigner } from './Action.Designer';
import { ActionDrawer } from './Action.Drawer';
import { ActionLink } from './Action.Link';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import useStyles from './Action.style';
import { ActionContextProvider } from './context';
import { useA } from './hooks';
import { ComposedAction } from './types';
import { linkageAction } from './utils';
import { lodash } from '@nocobase/utils';

export const Action: ComposedAction = observer(
  (props: any) => {
    const {
      popover,
      confirm,
      openMode: om,
      containerRefKey,
      component,
      useAction = useA,
      className,
      icon,
      title,
      ...others
    } = props;
    const { wrapSSR, componentCls, hashId } = useStyles();
    const { t } = useTranslation();
    const { onClick } = useProps(props);
    const [visible, setVisible] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const Designer = useDesigner();
    const field = useField<any>();
    const { run, element } = useAction();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const form = useForm();
    const values = useRecord();
    const designerProps = fieldSchema['x-designer-props'];
    const openMode = fieldSchema?.['x-component-props']?.['openMode'];
    const disabled = form.disabled || field.disabled || props.disabled;
    const openSize = fieldSchema?.['x-component-props']?.['openSize'];
    const linkageRules = fieldSchema?.['x-linkage-rules'] || [];
    const { designable } = useDesignable();
    const tarComponent = useComponent(component) || component;
    const { modal } = App.useApp();
    let actionTitle = title || compile(fieldSchema.title);
    actionTitle = lodash.isString(actionTitle) ? t(actionTitle) : actionTitle;

    useEffect(() => {
      field.linkageProperty = {};
      linkageRules
        .filter((k) => !k.disabled)
        .forEach((v) => {
          return v.actions?.map((h) => {
            linkageAction(h.operator, field, v.condition, values);
          });
        });
    }, [linkageRules, values, designable]);

    const renderButton = () => {
      if (!designable && field?.data?.hidden) {
        return null;
      }
      return (
        <SortableItem
          {...others}
          loading={field?.data?.loading}
          icon={icon ? <Icon type={icon} /> : null}
          disabled={disabled}
          style={{
            ...others.style,
            opacity: designable && field?.data?.hidden && 0.1,
          }}
          onClick={(e: React.MouseEvent) => {
            if (!disabled) {
              e.preventDefault();
              e.stopPropagation();
              const onOk = () => {
                onClick?.(e);
                setVisible(true);
                run();
              };
              if (confirm) {
                modal.confirm({
                  ...confirm,
                  onOk,
                });
              } else {
                onOk();
              }
            }
          }}
          component={tarComponent || Button}
          className={classnames('renderButton', className)}
          type={props.type === 'danger' ? undefined : props.type}
        >
          {actionTitle}
          <Designer {...designerProps} />
        </SortableItem>
      );
    };

    return wrapSSR(
      <div className={`${componentCls} ${hashId}`}>
        <ActionContextProvider
          button={renderButton()}
          visible={visible}
          setVisible={setVisible}
          formValueChanged={formValueChanged}
          setFormValueChanged={setFormValueChanged}
          openMode={openMode}
          openSize={openSize}
          containerRefKey={containerRefKey}
          fieldSchema={fieldSchema}
        >
          {popover && <RecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
          {!popover && renderButton()}
          {!popover && <div onClick={(e) => e.stopPropagation()}>{props.children}</div>}
          {element}
        </ActionContextProvider>
      </div>,
    );
  },
  { displayName: 'Action' },
);

Action.Popover = observer(
  (props) => {
    const { button, visible, setVisible } = useActionContext();
    return (
      <Popover
        {...props}
        destroyTooltipOnHide
        open={visible}
        onOpenChange={(visible) => {
          setVisible(visible);
        }}
        content={props.children}
      >
        {button}
      </Popover>
    );
  },
  { displayName: 'Action.Popover' },
);

Action.Popover.Footer = observer(
  (props) => {
    return <div className="popover">{props.children}</div>;
  },
  { displayName: 'Action.Popover.Footer' },
);

Action.Link = ActionLink;
Action.Designer = ActionDesigner;
Action.Drawer = ActionDrawer;
Action.Modal = ActionModal;
Action.Container = ActionContainer;
Action.Page = ActionPage;

export default Action;
