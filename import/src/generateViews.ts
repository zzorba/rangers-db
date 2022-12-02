import { forEach } from 'lodash';
import * as dotenv from 'dotenv';
dotenv.config();

import { TABLES } from './data';

function tableName(t: string) {
  return `${process.env.DATABASE}.${t}`;
}

forEach(TABLES, (schema, table) => {
  if (schema.textFields) {
    let joinClause = '';
    let joinSelectClause = '';
    if (schema.foreignKeys) {
      forEach(schema.foreignKeys, (fk_table, field) => {
        if (fk_table) {
          joinClause += `LEFT JOIN ${tableName(`${fk_table}_localized`)} fk_${fk_table} ON t.${field} = fk_${fk_table}.id AND tt.locale = fk_${fk_table}.locale\n`;
          const fkSchema = TABLES[fk_table];
          const fieldName = field.replace('_id', '');
          if (fkSchema) {
            forEach(fkSchema.textFields, tField => {
              joinSelectClause += `, fk_${fk_table}.${tField} as ${fieldName}_${tField}\n`;
            });
          }
        }
      });
    }
    let textFieldSelect = '';
    forEach(schema.textFields, field => {
      textFieldSelect += `t.${field} as real_${field}, tt.${field} as ${field},\n`;
    });
    let otherFieldSelect = '';
    if (schema.fields.length) {
      forEach(schema.fields, field => {
        otherFieldSelect += `, t.${field} as ${field}\n`;
      });
    }
    console.log(
      `DROP MATERIALIZED VIEW IF EXISTS ${tableName(`${table}_localized`)};
      CREATE MATERIALIZED VIEW ${tableName(`${table}_localized`)} AS
        SELECT
          t.id as id,
          ${textFieldSelect}
          tt.locale as locale
          ${otherFieldSelect}
          ${joinSelectClause}
        FROM ${tableName(table)} t JOIN ${tableName(`${table}_text`)} tt ON t.id = tt.id
          ${joinClause}
      ;\n\n\n`
    );
  }
});


forEach(TABLES, (table, name) => {
  console.log(`REFRESH MATERIALIZED VIEW ${tableName(`${name}_localized`)};`);
});
