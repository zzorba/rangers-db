import { forEach } from 'lodash';
import * as dotenv from 'dotenv';
dotenv.config();

import { TABLES } from './data';

function tableName(t: string) {
  return `${process.env.DATABASE}.${t}`;
}

console.log(`
  CREATE OR REPLACE FUNCTION rangers_deck_comment_count_increment() RETURNS TRIGGER AS $$
      BEGIN
          UPDATE rangers.deck
          SET comment_count = comment_count + 1
          WHERE id = NEW.deck_id;

          IF NEW.comment_id is not null THEN
            UPDATE rangers.comment
            SET response_count = response_count +1
            WHERE id = NEW.comment_id;
          END IF;
          RETURN NEW;
      END
  $$ LANGUAGE plpgsql;

  CREATE OR REPLACE FUNCTION rangers_deck_comment_count_decrement() RETURNS TRIGGER AS $$
    BEGIN
        UPDATE rangers.deck
        SET comment_count = comment_count - 1
        WHERE id = OLD.deck_id;

        IF OLD.comment_id is not null THEN
          UPDATE rangers.comment
          SET response_count = response_count - 1
          WHERE id = OLD.comment_id;
        END IF;
        RETURN OLD;
    END
  $$ LANGUAGE plpgsql;

  CREATE OR REPLACE FUNCTION rangers_deck_copy_count_increment() RETURNS TRIGGER AS $$
      BEGIN
          UPDATE rangers.deck
          SET copy_count = copy_count + 1
          WHERE id = NEW.deck_id AND NEW.user_id <> user_id;
          RETURN NEW;
      END
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER rangers_deck_copy_count_increment_trig AFTER INSERT ON rangers.deck_copy
      FOR EACH ROW EXECUTE PROCEDURE rangers_deck_copy_count_increment();
`)

console.log(`
  CREATE OR REPLACE FUNCTION ${tableName('upgrade_deck')}(deck_id integer, upgrade_data json)
  RETURNS ${tableName('deck')}
  LANGUAGE plpgsql
  AS $function$
    DECLARE
      result ${tableName('deck')};
      current_user_id text;
      deck_user_id text;
    BEGIN
      SELECT current_setting('hasura.user') :: json ->> 'x-hasura-user-id' INTO current_user_id;
      SELECT d.user_id FROM ${tableName('deck')} d WHERE d.id = deck_id INTO deck_user_id;
      IF current_user_id <> deck_user_id THEN
          RAISE EXCEPTION 'You can only upgrade your own deck.' USING ERRCODE=22000;
      END IF;

      WITH
          base_deck as (
            SELECT
              d.*,
              nextval(pg_get_serial_sequence('${tableName('deck')}', 'id')) new_deck_id
            FROM ${tableName('deck')} d
            WHERE
              d.id = deck_id AND
              d.user_id = (current_setting('hasura.user') :: json ->> 'x-hasura-user-id') AND
              d.next_deck_id is null
          ),
          inserted as (
            insert into ${tableName('deck')} (
              id, user_id, meta, slots, side_slots, description, name, awa, spi, fit, foc, version, upgrade
            )
            SELECT bd.new_deck_id, bd.user_id, bd.meta, bd.slots, bd.side_slots, bd.description, bd.name, bd.awa, bd.spi, bd.fit, bd.foc, bd.version + 1, upgrade_data
            FROM base_deck bd
          )
      UPDATE ${tableName('deck')} d
      SET next_deck_id = bd.new_deck_id
      FROM base_deck bd
      WHERE bd.id = d.id
      RETURNING * into result;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Cannot upgrade deck' USING ERRCODE=22000;
      END IF;
      return result;
    END
  $function$\n\n\n`
);

console.log(`
  CREATE OR REPLACE VIEW ${tableName('latest_deck')} AS
  SELECT
    id as deck_id,
    campaign_id,
    user_id
  FROM ${tableName('deck')}
  WHERE next_deck_id is null;\n\n\n
`);

console.log(`
  CREATE OR REPLACE VIEW ${tableName('user_campaign')} AS
    SELECT
      campaign_access.user_id,
      campaign_access.campaign_id
    FROM
      ${tableName('campaign_access')}
  UNION
    SELECT
      campaign.user_id,
      campaign.id
    FROM
      ${tableName('campaign')};\n\n\n`)

let localizedUpdatedClauses: string[] = [];
let updatedClauses: string[] = [];
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
            forEach(fkSchema.fields, tField => {
              joinSelectClause += `, fk_${fk_table}.${tField} as ${fieldName}_${tField}\n`;
            });

            forEach(fkSchema.foreignKeys, (fkFkTableName, fkField) => {
              if (fkFkTableName) {
                const cleanField = fkField.replace('_id', '');
                const fkFkSchema = TABLES[fk_table];
                if (fkFkSchema) {
                  forEach(fkSchema.textFields, tField2 => {
                    joinSelectClause += `, fk_${fk_table}.${cleanField}_${tField2} as ${fieldName}_${cleanField}_${tField2}\n`;
                  });
                }
              }
            })
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
          GREATEST(t.updated_at, tt.updated_at) as updated_at,
          tt.locale as locale
          ${otherFieldSelect}
          ${joinSelectClause}
        FROM ${tableName(table)} t JOIN ${tableName(`${table}_text`)} tt ON t.id = tt.id
          ${joinClause}
      ;\n\n\n`
    );
    localizedUpdatedClauses.push(
      `(SELECT locale, MAX(updated_at) as updated_at FROM ${tableName(`${table}_localized`)} GROUP BY locale)\n`
    );
  } else {
    updatedClauses.push(
      `(SELECT MAX(updated_at) as updated_at FROM ${tableName(table)})\n`
    );
  }
});

console.log(`DROP MATERIALIZED VIEW IF EXISTS ${tableName('card_updated')};`)
if (updatedClauses.length) {
  console.log(
    `CREATE MATERIALIZED VIEW ${tableName('card_updated')} AS
      SELECT locale, GREATEST(a.updated_at, b.updated_at)
      FROM (
        SELECT locale, MAX(updated_at) FROM (${ localizedUpdatedClauses.join(' UNION ')}) GROUP BY locale
      ) a FULL JOIN (
        SELECT MAX(updated_at) FROM (${updatedClauses.join(' UNION ALL ')})
      ) b;
  `);
} else {
  console.log(
    `CREATE MATERIALIZED VIEW ${tableName('card_updated')} AS
      SELECT locale, MAX(updated_at) as updated_at FROM (
        ${ localizedUpdatedClauses.join(' UNION ALL ')}
      ) t GROUP BY locale
    ;`
  );
}

console.log(
  `
  CREATE OR REPLACE FUNCTION rangers.card_search(search text DEFAULT NULL::text, locale text DEFAULT 'en'::text, type_in text[] DEFAULT NULL::text[], pack_in text[] DEFAULT NULL::text[], aspect_in text[] DEFAULT NULL::text[], set_in text[] DEFAULT NULL::text[], level_eq integer DEFAULT NULL::integer, level_lt integer DEFAULT NULL::integer, level_gt integer DEFAULT NULL::integer, search_traits boolean DEFAULT NULL::boolean, search_text boolean DEFAULT NULL::boolean, search_flavor boolean DEFAULT NULL::boolean, _limit integer DEFAULT 10, _offset integer DEFAULT 0)
 RETURNS SETOF rangers.card_localized
 LANGUAGE plpgsql
 STABLE
AS $function$
#variable_conflict use_variable
DECLARE
  the_limit integer;
BEGIN
    if _limit < 25 then
      the_limit = _limit;
    else
      the_limit = 25;
    end if;

    RETURN QUERY SELECT
      c.*
    FROM
      rangers.card_localized c,
      websearch_to_tsquery(search) query
    WHERE
      c.locale = locale
      AND (
        type_in is null
        or c.type_id=ANY(type_in)
      )
      AND (
        pack_in is null
        or c.pack_id=ANY(pack_in)
      )
      and (
        aspect_in is null
        or c.aspect_id=ANY(aspect_in)
      )
      and (
        set_in is null
        or c.set_id=ANY(set_in)
      )
      and (
        level_eq is null
        or c.level = level_eq
      )
      and (
        level_lt is null
        or c.level < level_lt
      )
      and (
        level_gt is null
        or c.level > level_gt
      )
      and (
        search IS NULL OR
        to_tsvector(name) @@ query OR
        (search_traits AND to_tsvector(traits) @@ query) OR
        (search_text AND to_tsvector("text") @@ query) OR
        (search_text AND to_tsvector(sun_challenge) @@ query) OR
        (search_text AND to_tsvector(crest_challenge) @@ query) OR
        (search_text AND to_tsvector(mountain_challenge) @@ query) OR
        (search_flavor AND to_tsvector(flavor) @@ query)
      )
    ORDER BY id
    LIMIT the_limit
    OFFSET _offset;
END;
$function$
  `)
forEach(TABLES, (table, name) => {
  console.log(`REFRESH MATERIALIZED VIEW ${tableName(`${name}_localized`)};`);
});
console.log(`REFRESH MATERIALIZED VIEW ${tableName('card_updated')};`)