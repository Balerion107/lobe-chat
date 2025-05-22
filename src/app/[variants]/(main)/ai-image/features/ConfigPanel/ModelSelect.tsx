import { ActionIcon, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { ItemType } from 'antd/es/menu/interface';
import { LucideArrowRight, LucideBolt } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ModelItemRender, ProviderItemRender } from '@/components/ModelSelect';
import { isDeprecatedEdition } from '@/const/version';
import ActionDropdown from '@/features/ChatInput/ActionBar/components/ActionDropdown';
import { useAiImageStore } from '@/store/aiImage';
import { generationTopicSelectors } from '@/store/aiImage/slices/generationTopic/selectors';
import { useAiInfraStore } from '@/store/aiInfra';
import { aiProviderSelectors } from '@/store/aiInfra/slices/aiProvider/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { EnabledProviderWithModels } from '@/types/aiProvider';

const useStyles = createStyles(({ css, prefixCls, token }) => ({
  menu: css`
    .${prefixCls}-dropdown-menu-item {
      display: flex;
      gap: 8px;
    }
    .${prefixCls}-dropdown-menu {
      &-item-group-title {
        padding-inline: 8px;
      }

      &-item-group-list {
        margin: 0 !important;
      }
    }

    max-height: 500px;
    overflow-y: scroll;
  `,
  modelSelect: css`
    cursor: pointer;
    padding: 8px;
    border-radius: ${token.borderRadius}px;
    border: 1px solid ${token.colorBorderSecondary};

    &:hover {
      background-color: ${token.colorFillTertiary};
    }
  `,
}));

const menuKey = (provider: string, model: string) => `${provider}-${model}`;

const ModelSelect = memo(() => {
  const { t } = useTranslation('components');
  const { styles, theme } = useStyles();
  const { showLLM } = useServerConfigStore(featureFlagsSelectors);
  const router = useRouter();

  const [currentModel, currentProvider] = useAiImageStore((s) => [
    generationTopicSelectors.currentGenerationTopicModel(s),
    generationTopicSelectors.currentGenerationTopicProvider(s),
  ]);

  const enabledList = useAiInfraStore(aiProviderSelectors.enabledImageModelList);

  const items = useMemo<ItemType[]>(() => {
    const getModelItems = (provider: EnabledProviderWithModels) => {
      const items = provider.children.map((model) => ({
        key: menuKey(provider.id, model.id),
        label: <ModelItemRender {...model} {...model.abilities} />,
        onClick: async () => {
          // TODO: ...
        },
      }));

      // if there is empty items, add a placeholder guide
      if (items.length === 0)
        return [
          {
            key: `${provider.id}-empty`,
            label: (
              <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
                {t('ModelSwitchPanel.emptyModel')}
                <Icon icon={LucideArrowRight} />
              </Flexbox>
            ),
            onClick: () => {
              router.push(
                isDeprecatedEdition ? '/settings/llm' : `/settings/provider/${provider.id}`,
              );
            },
          },
        ];

      return items;
    };

    if (enabledList.length === 0)
      return [
        {
          key: `no-provider`,
          label: (
            <Flexbox gap={8} horizontal style={{ color: theme.colorTextTertiary }}>
              {t('ModelSwitchPanel.emptyProvider')}
              <Icon icon={LucideArrowRight} />
            </Flexbox>
          ),
          onClick: () => {
            router.push(isDeprecatedEdition ? '/settings/llm' : `/settings/provider`);
          },
        },
      ];

    // otherwise show with provider group
    return enabledList.map((provider) => ({
      children: getModelItems(provider),
      key: provider.id,
      label: (
        <Flexbox horizontal justify="space-between">
          <ProviderItemRender
            logo={provider.logo}
            name={provider.name}
            provider={provider.id}
            source={provider.source}
          />
          {showLLM && (
            <Link
              href={isDeprecatedEdition ? '/settings/llm' : `/settings/provider/${provider.id}`}
            >
              <ActionIcon
                icon={LucideBolt}
                size={'small'}
                title={t('ModelSwitchPanel.goToSettings')}
              />
            </Link>
          )}
        </Flexbox>
      ),
      type: 'group',
    }));
  }, [enabledList, router, t, theme.colorTextTertiary]);

  return (
    <ActionDropdown
      menu={{
        activeKey: menuKey(currentProvider, currentModel),
        className: styles.menu,
        items,
      }}
      placement={'bottom'}
      trigger={['click']}
    >
      <Flexbox align="center" className={styles.modelSelect} horizontal justify="space-between">
        <ModelItemRender displayName={currentModel} id={currentModel} showInfoTag={false} />
      </Flexbox>
    </ActionDropdown>
  );
});

export default ModelSelect;
