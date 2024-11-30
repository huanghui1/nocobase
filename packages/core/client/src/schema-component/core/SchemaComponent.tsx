/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { IRecursionFieldProps, ISchemaFieldProps, Schema } from '@formily/react';
import _ from 'lodash';
import React, { memo, useContext, useMemo } from 'react';
import { NocoBaseRecursionField } from '../../formily/NocoBaseRecursionField';
import { SchemaComponentContext } from '../context';
import { SchemaComponentOptions } from './SchemaComponentOptions';

type SchemaComponentOnChange = {
  onChange?: (s: Schema) => void;
};

function toSchema(schema?: any) {
  if (Schema.isSchemaInstance(schema)) {
    return schema;
  }
  if (schema?.name) {
    return new Schema({
      type: 'object',
      properties: {
        [schema.name]: schema,
      },
    });
  }
  return new Schema(schema);
}

const useMemoizedSchema = (schema) => {
  return useMemo(() => toSchema(schema), []);
};

interface DistributedProps {
  /**
   * 是否和父级隔离刷新
   * @default false
   */
  distributed?: boolean;
}

const RecursionSchemaComponent = memo((props: ISchemaFieldProps & SchemaComponentOnChange & DistributedProps) => {
  const { components, scope, schema: _schema, distributed, onChange, ...others } = props;
  const ctx = useContext(SchemaComponentContext);
  const schema = useMemo(() => toSchema(_schema), [_schema]);
  const value = useMemo(
    () => ({
      ...ctx,
      distributed: ctx.distributed == false ? false : distributed,
      refresh: _.noop,
    }),
    [ctx, distributed],
  );

  return (
    <SchemaComponentContext.Provider value={value}>
      <SchemaComponentOptions inherit components={components} scope={scope}>
        <NocoBaseRecursionField {...others} schema={schema} isUseFormilyField />
      </SchemaComponentOptions>
    </SchemaComponentContext.Provider>
  );
});

RecursionSchemaComponent.displayName = 'RecursionSchemaComponent';

const MemoizedSchemaComponent = memo((props: ISchemaFieldProps & SchemaComponentOnChange & DistributedProps) => {
  const { schema, ...others } = props;
  const s = useMemoizedSchema(schema);
  return <RecursionSchemaComponent {...others} schema={s} />;
});

MemoizedSchemaComponent.displayName = 'MemoizedSchemaComponent';

export const SchemaComponent = memo(
  (
    props: (ISchemaFieldProps | IRecursionFieldProps) & { memoized?: boolean } & SchemaComponentOnChange &
      DistributedProps,
  ) => {
    const { memoized, ...others } = props;
    if (memoized) {
      return <MemoizedSchemaComponent {...others} />;
    }
    return <RecursionSchemaComponent {...others} />;
  },
);

SchemaComponent.displayName = 'SchemaComponent';
