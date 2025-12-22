import { useDialog } from '@/context/DialogContext';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { apiTokenService } from '@/services/apiTokenService';
import {
  modalErrorClass,
  modalInputClass,
  modalLabelClass,
  modalOverlayClass,
  modalPanelClass,
  modalPrimaryButtonClass,
  modalSecondaryButtonClass,
  modalSelectClass,
} from '@/styles/modalStyles';
import type {
  ApiTokenScope,
  ApiTokenSummaryResponse,
  CreateApiTokenResponse,
} from '@/types/apiToken';
import type { BoardMemberRole } from '@/types/board';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiClipboardCopy, HiDocumentText, HiKey, HiRefresh, HiTrash } from 'react-icons/hi';

interface ApiTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: number;
  boardName: string;
  currentRole?: BoardMemberRole;
  canEdit: boolean;
}

const ROLE_ORDER: BoardMemberRole[] = ['VIEWER', 'EDITOR', 'MANAGER'];

const apiTokenScopes: ApiTokenScope[] = [
  'BOARD_READ',
  'BOARD_WRITE',
  'CARD_READ',
  'CARD_WRITE',
  'CARD_ARCHIVE',
  'CARD_MANAGE',
];

const roleScopeMap: Record<BoardMemberRole, ApiTokenScope[]> = {
  VIEWER: ['BOARD_READ', 'CARD_READ'],
  EDITOR: ['BOARD_READ', 'BOARD_WRITE', 'CARD_READ', 'CARD_WRITE', 'CARD_ARCHIVE'],
  MANAGER: ['BOARD_READ', 'BOARD_WRITE', 'CARD_READ', 'CARD_WRITE', 'CARD_ARCHIVE', 'CARD_MANAGE'],
};

export const ApiTokenModal = ({
  isOpen,
  onClose,
  boardId,
  boardName,
  currentRole,
  canEdit,
}: ApiTokenModalProps) => {
  const { t } = useTranslation(['board', 'common']);
  const { alert, confirm } = useDialog();
  const { stage, close } = useModalAnimation(() => onClose());

  const maxRole = useMemo<BoardMemberRole>(() => {
    if (currentRole) {
      return currentRole;
    }
    if (canEdit) {
      return 'EDITOR';
    }
    return 'VIEWER';
  }, [canEdit, currentRole]);

  const allowedRoles = useMemo(() => {
    const maxIndex = ROLE_ORDER.indexOf(maxRole);
    return ROLE_ORDER.slice(0, Math.max(maxIndex, 0) + 1);
  }, [maxRole]);

  const [tokens, setTokens] = useState<ApiTokenSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<BoardMemberRole>(allowedRoles[0] ?? 'VIEWER');
  const [scopes, setScopes] = useState<ApiTokenScope[]>(roleScopeMap[role]);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdToken, setCreatedToken] = useState<CreateApiTokenResponse | null>(null);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    void loadTokens();
  }, [isOpen]);

  useEffect(() => {
    if (!allowedRoles.includes(role)) {
      const fallbackRole = allowedRoles[0] ?? 'VIEWER';
      setRole(fallbackRole);
      setScopes(roleScopeMap[fallbackRole]);
    }
  }, [allowedRoles, role]);

  useEffect(() => {
    setScopes(roleScopeMap[role]);
  }, [role]);

  if (!isOpen) return null;

  const loadTokens = async () => {
    try {
      setLoading(true);
      const list = await apiTokenService.listTokens();
      setTokens(list.filter((item) => item.boardId === boardId));
    } catch (err) {
      console.error('Failed to load api tokens:', err);
      setError(t('board:apiTokens.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      await alert(t('board:apiTokens.nameRequired'));
      return;
    }
    if (scopes.length === 0) {
      await alert(t('board:apiTokens.scopeRequired'));
      return;
    }
    try {
      setSaving(true);
      const response = await apiTokenService.createToken({
        name: name.trim(),
        boardId,
        role,
        scopes,
        expiresAt: expiresAt ? normalizeDateTime(expiresAt) : null,
      });
      setCreatedToken(response);
      setName('');
      setExpiresAt('');
      await loadTokens();
    } catch (err) {
      console.error('Failed to create api token:', err);
      await alert(t('board:apiTokens.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      await alert(t('board:apiTokens.copySuccess'));
    } catch (err) {
      console.error('Failed to copy token:', err);
      await alert(t('board:apiTokens.copyFailed'));
    }
  };

  const handleRevoke = async (tokenId: number) => {
    const confirmed = await confirm(t('board:apiTokens.revokeConfirm'), {
      confirmText: t('board:apiTokens.revokeAction'),
      cancelText: t('common:button.cancel', { defaultValue: '취소' }),
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      await apiTokenService.revokeToken(tokenId);
      await loadTokens();
    } catch (err) {
      console.error('Failed to revoke api token:', err);
      await alert(t('board:apiTokens.revokeFailed'));
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('ko-KR');
  };

  const normalizeDateTime = (value: string) => {
    if (value.length === 16) {
      return `${value}:00`;
    }
    return value;
  };

  const modalContent = (
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className={modalPanelClass({ stage, maxWidth: 'max-w-5xl', padding: 'p-6', scrollable: true })}>
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
                {t('board:apiTokens.label')}
              </p>
              <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">
                {t('board:apiTokens.title', { boardName })}
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                {t('board:apiTokens.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDocs(true)}
                className="px-3 py-2 rounded-xl bg-white/40 border border-white/40 text-pastel-blue-700 hover:bg-white/60 transition flex items-center gap-2 text-sm"
              >
                <HiDocumentText />
                {t('board:apiTokens.docs.link')}
              </button>
              <button
                onClick={close}
                className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
          <section className="glass rounded-2xl p-5 border border-white/40">
            <h3 className="text-lg font-semibold text-pastel-blue-900 mb-4 flex items-center gap-2">
              <HiKey className="text-pastel-blue-500" />
              {t('board:apiTokens.createTitle')}
            </h3>
            {error && <div className={`${modalErrorClass} mb-4`}>{error}</div>}
            <div className="space-y-4">
              <div>
                <label className={modalLabelClass}>{t('board:apiTokens.nameLabel')}</label>
                <input
                  className={modalInputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('board:apiTokens.namePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={modalLabelClass}>{t('board:apiTokens.roleLabel')}</label>
                  <select
                    className={modalSelectClass}
                    value={role}
                    onChange={(e) => setRole(e.target.value as BoardMemberRole)}
                  >
                    {allowedRoles.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={modalLabelClass}>{t('board:apiTokens.expiresLabel')}</label>
                  <input
                    type="datetime-local"
                    className={modalInputClass}
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={modalLabelClass}>{t('board:apiTokens.scopesLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleScopeMap[role].map((scope) => (
                    <label
                      key={scope}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 border border-white/40 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        className="accent-pastel-blue-500"
                        checked={scopes.includes(scope)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScopes((prev) => [...prev, scope]);
                          } else {
                            setScopes((prev) => prev.filter((item) => item !== scope));
                          }
                        }}
                      />
                      {t(`board:apiTokens.scopeLabels.${scope}`)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className={modalPrimaryButtonClass}
                  onClick={handleCreate}
                  disabled={saving}
                >
                  {saving ? t('board:apiTokens.creating') : t('board:apiTokens.createAction')}
                </button>
                <button
                  className={modalSecondaryButtonClass}
                  onClick={() => {
                    setName('');
                    setExpiresAt('');
                    setRole(allowedRoles[0] ?? 'VIEWER');
                    setScopes(roleScopeMap[allowedRoles[0] ?? 'VIEWER']);
                  }}
                >
                  {t('board:apiTokens.resetAction')}
                </button>
              </div>
            </div>

            {createdToken && (
              <div className="mt-6 p-4 rounded-2xl bg-white/60 border border-white/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-pastel-blue-500 font-semibold">
                      Token
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {t('board:apiTokens.tokenHint')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(createdToken.token)}
                    className="px-3 py-2 rounded-xl bg-pastel-blue-500 text-white text-sm font-semibold hover:bg-pastel-blue-600 transition flex items-center gap-2"
                  >
                    <HiClipboardCopy />
                    {t('common:button.copy', { defaultValue: '복사' })}
                  </button>
                </div>
                <div className="mt-3 px-4 py-3 rounded-xl bg-slate-900 text-white font-mono text-sm whitespace-nowrap overflow-x-auto">
                  {createdToken.token}
                </div>
              </div>
            )}
          </section>

          <section className="glass rounded-2xl p-5 border border-white/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-pastel-blue-900">
                {t('board:apiTokens.listTitle')}
              </h3>
              <button
                onClick={loadTokens}
                className="px-3 py-2 rounded-xl bg-white/40 border border-white/50 text-slate-600 hover:bg-white/60 transition flex items-center gap-2 text-sm"
                disabled={loading}
              >
                <HiRefresh />
                {t('common:refresh.refresh')}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 rounded-full border-2 border-pastel-blue-500 border-t-transparent animate-spin" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-10">
                {t('board:apiTokens.empty')}
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="relative rounded-2xl border border-white/60 bg-white/70 p-4 shadow-glass-sm hover:shadow-glass transition space-y-3"
                  >
                    <div className="absolute inset-0 pointer-events-none rounded-2xl border border-pastel-blue-100/70" />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{token.name}</p>
                        <p className="text-xs text-slate-500 mt-1">Prefix: {token.tokenPrefix}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {token.revokedAt ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-600">
                            {t('board:apiTokens.status.revoked')}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-600">
                            {t('board:apiTokens.status.active')}
                          </span>
                        )}
                        {!token.revokedAt && (
                          <button
                            onClick={() => handleRevoke(token.id)}
                            className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
                            title={t('board:apiTokens.revokeAction')}
                          >
                            <HiTrash />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-pastel-blue-100 text-pastel-blue-700">
                        {token.role}
                      </span>
                      {token.scopes.map((scope) => (
                        <span
                          key={scope}
                  className="text-xs px-2 py-1 rounded-full bg-white/60 text-slate-600"
                >
                  {t(`board:apiTokens.scopeLabels.${scope}`)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <div>
                        <span className="block text-slate-400">{t('board:apiTokens.fields.expires')}</span>
                        <span>{formatDate(token.expiresAt)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">{t('board:apiTokens.fields.lastUsed')}</span>
                        <span>{formatDate(token.lastUsedAt)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">{t('board:apiTokens.fields.created')}</span>
                        <span>{formatDate(token.createdAt)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">{t('board:apiTokens.fields.revoked')}</span>
                        <span>{formatDate(token.revokedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showDocs && <ApiTokenDocsModal onClose={() => setShowDocs(false)} />}
    </>
  );
};

interface ApiTokenDocsModalProps {
  onClose: () => void;
}

const ApiTokenDocsModal = ({ onClose }: ApiTokenDocsModalProps) => {
  const { t } = useTranslation(['board', 'common']);
  const { stage, close } = useModalAnimation(onClose);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleExpanded = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const sections = [
    {
      title: t('board:apiTokens.docs.sections.boards'),
      items: [
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}', scope: 'BOARD_READ' },
        { method: 'PATCH', path: '/workspaces/{workspaceId}/boards/{boardId}', scope: 'BOARD_WRITE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/archive', scope: 'BOARD_WRITE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/unarchive', scope: 'BOARD_WRITE' },
        { method: 'DELETE', path: '/workspaces/{workspaceId}/boards/{boardId}', scope: 'BOARD_WRITE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/restore', scope: 'BOARD_WRITE' },
      ],
    },
    {
      title: t('board:apiTokens.docs.sections.columns'),
      items: [
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/columns', scope: 'BOARD_READ' },
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}', scope: 'BOARD_READ' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns', scope: 'BOARD_WRITE' },
        { method: 'PUT', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}', scope: 'BOARD_WRITE' },
        { method: 'DELETE', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}', scope: 'BOARD_WRITE' },
      ],
    },
    {
      title: t('board:apiTokens.docs.sections.cards'),
      items: [
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards', scope: 'CARD_READ' },
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}', scope: 'CARD_READ' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards', scope: 'CARD_WRITE' },
        { method: 'PUT', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}', scope: 'CARD_WRITE' },
        { method: 'DELETE', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}', scope: 'CARD_WRITE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/start', scope: 'CARD_WRITE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/archive', scope: 'CARD_ARCHIVE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/unarchive', scope: 'CARD_ARCHIVE' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/archive-all', scope: 'CARD_ARCHIVE' },
        { method: 'DELETE', path: '/workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}/permanent', scope: 'CARD_MANAGE' },
      ],
    },
    {
      title: t('board:apiTokens.docs.sections.comments'),
      items: [
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments', scope: 'CARD_READ' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments', scope: 'CARD_WRITE' },
        { method: 'PUT', path: '/workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments/{commentId}', scope: 'CARD_WRITE' },
        { method: 'DELETE', path: '/workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments/{commentId}', scope: 'CARD_WRITE' },
      ],
    },
    {
      title: t('board:apiTokens.docs.sections.excel'),
      items: [
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/excel/template', scope: 'BOARD_READ' },
        { method: 'GET', path: '/workspaces/{workspaceId}/boards/{boardId}/excel/export', scope: 'BOARD_READ' },
        { method: 'POST', path: '/workspaces/{workspaceId}/boards/{boardId}/excel/import', scope: 'BOARD_WRITE' },
      ],
    },
  ];

  const schemaMap: Record<string, { request?: string[]; response?: string[] }> = {
    'GET /workspaces/{workspaceId}/boards/{boardId}': {
      response: [
        'id: number',
        'workspaceId: number',
        'ownerId: number',
        'ownerName: string',
        'name: string',
        'description?: string | null',
        'themeColor?: string | null',
        'icon?: string | null',
        'status: ACTIVE | ARCHIVED | DELETED',
        'createdAt: string',
        'updatedAt: string',
        'invitationStatus?: PENDING | ACCEPTED | DECLINED | EXPIRED',
        'currentUserRole?: VIEWER | EDITOR | MANAGER',
        'canEdit?: boolean',
        'canManage?: boolean',
        'mode?: KANBAN | SPRINT',
      ],
    },
    'PATCH /workspaces/{workspaceId}/boards/{boardId}': {
      request: [
        'name?: string',
        'description?: string',
        'themeColor?: string',
        'icon?: string',
        'mode?: KANBAN | SPRINT',
      ],
      response: ['Board (same as GET /boards/{boardId})'],
    },
    'GET /workspaces/{workspaceId}/boards/{boardId}/columns': {
      response: [
        'id: number',
        'boardId: number',
        'name: string',
        'description?: string | null',
        'bgColor?: string | null',
        'position: number',
        'createdAt: string',
        'updatedAt: string',
      ],
    },
    'POST /workspaces/{workspaceId}/boards/{boardId}/columns': {
      request: ['name: string', 'description?: string', 'bgColor?: string'],
      response: ['Column (same fields as list)'],
    },
    'PUT /workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}': {
      request: ['name?: string', 'description?: string', 'bgColor?: string', 'position?: number'],
      response: ['Column (same fields as list)'],
    },
    'GET /workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards': {
      response: [
        'content: Card[]',
        'page: number',
        'size: number',
        'totalElements: number',
        'totalPages: number',
        'last: boolean',
      ],
    },
    'GET /workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}': {
      response: [
        'id: number',
        'columnId: number',
        'title: string',
        'description?: string | null',
        'position: number',
        'bgColor?: string | null',
        'priority?: HIGH | MEDIUM | LOW',
        'dueDate?: string | null',
        'assigneeId?: number | null',
        'isArchived?: boolean',
        'isCompleted?: boolean',
        'createdAt: string',
        'updatedAt: string',
        'labels?: Label[]',
        'parentCard?: ParentCardSummary',
        'childCards?: ChildCardSummary[]',
      ],
    },
    'POST /workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards': {
      request: [
        'title: string',
        'description?: string',
        'bgColor?: string',
        'priority?: HIGH | MEDIUM | LOW',
        'dueDate?: string',
        'assigneeId?: number',
        'parentCardId?: number',
      ],
      response: ['Card (same fields as GET card)'],
    },
    'PUT /workspaces/{workspaceId}/boards/{boardId}/columns/{columnId}/cards/{cardId}': {
      request: [
        'title?: string',
        'description?: string',
        'bgColor?: string',
        'priority?: HIGH | MEDIUM | LOW',
        'dueDate?: string | null',
        'assigneeId?: number | null',
        'isCompleted?: boolean',
        'position?: number',
        'columnId?: number',
      ],
      response: ['Card (same fields as GET card)'],
    },
    'GET /workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments': {
      response: [
        'content: Comment[]',
        'page: number',
        'size: number',
        'totalElements: number',
        'totalPages: number',
        'last: boolean',
      ],
    },
    'POST /workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments': {
      request: ['content: string'],
      response: [
        'id: number',
        'cardId: number',
        'authorId: number',
        'authorName: string',
        'content: string',
        'isDeleted: boolean',
        'createdAt: string',
        'updatedAt: string',
      ],
    },
    'PUT /workspaces/{workspaceId}/boards/{boardId}/cards/{cardId}/comments/{commentId}': {
      request: ['content: string'],
      response: ['Comment (same fields as create)'],
    },
    'POST /workspaces/{workspaceId}/boards/{boardId}/excel/import': {
      request: ['file: multipart/form-data', 'mode?: merge | overwrite'],
      response: ['jobId: string', 'mode: merge | overwrite', 'state: string', 'filename: string'],
    },
  };

  const modalContent = (
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className={modalPanelClass({ stage, maxWidth: 'max-w-5xl', padding: 'p-6', scrollable: true })}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
              {t('board:apiTokens.docs.title')}
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">
              {t('board:apiTokens.docs.title')}
            </h2>
            <p className="text-sm text-slate-600 mt-2">{t('board:apiTokens.docs.subtitle')}</p>
          </div>
          <button
            onClick={close}
            className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/40 bg-white/40 p-5">
            <h3 className="text-lg font-semibold text-pastel-blue-900 mb-3">
              {t('board:apiTokens.docs.auth.title')}
            </h3>
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t('board:apiTokens.docs.auth.baseUrl')}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs">
                  /api/v1
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {t('board:apiTokens.docs.auth.header')}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-mono text-xs">
                  Authorization: Bearer &lt;API_TOKEN&gt;
                </span>
              </div>
              <div className="text-slate-600">{t('board:apiTokens.docs.auth.scope')}</div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/40 bg-white/40 p-5">
            <h3 className="text-lg font-semibold text-pastel-blue-900 mb-3">
              {t('board:apiTokens.docs.scopesTitle')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {apiTokenScopes.map((scope) => (
                <span
                  key={scope}
                  className="text-xs px-3 py-1 rounded-full bg-white/70 text-slate-600 border border-white/60"
                >
                  {scope} · {t(`board:apiTokens.scopeLabels.${scope}`)}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-pastel-blue-900">
              {t('board:apiTokens.docs.endpointsTitle')}
            </h3>
            {sections.map((section) => (
              <div key={section.title} className="rounded-2xl border border-white/40 bg-white/40 p-5">
                <h4 className="text-base font-semibold text-slate-800 mb-3">{section.title}</h4>
                <div className="space-y-2 text-xs text-slate-700">
                  {section.items.map((item) => (
                    <div key={`${item.method}-${item.path}`} className="rounded-xl border border-white/40 bg-white/50">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(`${item.method} ${item.path}`)}
                        className="w-full flex flex-wrap items-center gap-3 px-3 py-2 text-left text-xs text-slate-700"
                      >
                        <span className="w-16 text-center px-2 py-1 rounded-lg bg-slate-900 text-white font-semibold">
                          {item.method}
                        </span>
                        <span className="font-mono text-slate-700">{item.path}</span>
                        <span className="ml-auto text-slate-500">
                          {t('board:apiTokens.docs.scopeLabel')}: {item.scope}
                        </span>
                      </button>
                      {expandedKey === `${item.method} ${item.path}` && (
                        <div className="px-4 pb-3 text-xs text-slate-600 space-y-2">
                          {schemaMap[`${item.method} ${item.path}`]?.request && (
                            <div>
                              <p className="text-slate-500 font-semibold">
                                {t('board:apiTokens.docs.request')}
                              </p>
                              <div className="mt-1 rounded-lg bg-slate-900 text-white font-mono text-xs px-3 py-2 whitespace-pre-line">
                                {schemaMap[`${item.method} ${item.path}`]?.request?.join('\n')}
                              </div>
                            </div>
                          )}
                          {schemaMap[`${item.method} ${item.path}`]?.response && (
                            <div>
                              <p className="text-slate-500 font-semibold">
                                {t('board:apiTokens.docs.response')}
                              </p>
                              <div className="mt-1 rounded-lg bg-slate-900 text-white font-mono text-xs px-3 py-2 whitespace-pre-line">
                                {schemaMap[`${item.method} ${item.path}`]?.response?.join('\n')}
                              </div>
                            </div>
                          )}
                          {!schemaMap[`${item.method} ${item.path}`] && (
                            <div className="text-slate-500">
                              {t('board:apiTokens.docs.noSchema')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
