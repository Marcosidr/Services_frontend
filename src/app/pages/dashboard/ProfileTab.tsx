import { Navigation } from "lucide-react";
import type { ChangeEvent } from "react";
import type { DashboardUser, ProfileForm } from "./types";

type ProfileTabProps = {
  userRole: DashboardUser["role"] | undefined;
  profileForm: ProfileForm;
  onUpdateField: <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => void;
  onUserPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onProfessionalPhotoUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onUseCurrentProfessionalLocation: () => void;
  professionalLocationLoading: boolean;
  onSaveProfile: () => Promise<void>;
  savingProfile: boolean;
  profileSuccess: boolean;
  profileError: string;
};

export function ProfileTab({
  userRole,
  profileForm,
  onUpdateField,
  onUserPhotoUpload,
  onProfessionalPhotoUpload,
  onUseCurrentProfessionalLocation,
  professionalLocationLoading,
  onSaveProfile,
  savingProfile,
  profileSuccess,
  profileError
}: ProfileTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
        <h3 className="mb-1 text-slate-900">Editar perfil</h3>
        <p className="mb-4 text-sm text-slate-500">
          Atualize foto, bio e endereco do seu perfil.
        </p>
        <p className="mb-3 text-xs text-slate-500">
          Email e CPF sao bloqueados para edicao.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            value={profileForm.email}
            readOnly
            placeholder="E-mail"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
          />
          <input
            value={profileForm.cpf}
            readOnly
            placeholder="CPF"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none"
          />
          <input
            value={profileForm.name}
            onChange={(event) => onUpdateField("name", event.target.value)}
            placeholder="Nome"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.phone}
            onChange={(event) => onUpdateField("phone", event.target.value)}
            placeholder="Telefone"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <div className="md:col-span-2">
            <p className="mb-1.5 text-xs text-slate-500">Foto de perfil</p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void onUserPhotoUpload(event);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            {profileForm.photoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={profileForm.photoUrl}
                  alt="Preview da foto de perfil"
                  className="h-14 w-14 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onUpdateField("photoUrl", "")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remover foto
                </button>
              </div>
            )}
          </div>
          <textarea
            value={profileForm.bio}
            onChange={(event) => onUpdateField("bio", event.target.value)}
            placeholder="Sua bio (estilo LinkedIn)"
            rows={3}
            className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400 md:col-span-2"
          />
          <input
            value={profileForm.cep}
            onChange={(event) => onUpdateField("cep", event.target.value)}
            placeholder="CEP"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.endereco}
            onChange={(event) => onUpdateField("endereco", event.target.value)}
            placeholder="Endereco"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.numero}
            onChange={(event) => onUpdateField("numero", event.target.value)}
            placeholder="Numero"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.complemento}
            onChange={(event) => onUpdateField("complemento", event.target.value)}
            placeholder="Complemento"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.bairro}
            onChange={(event) => onUpdateField("bairro", event.target.value)}
            placeholder="Bairro"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.cidade}
            onChange={(event) => onUpdateField("cidade", event.target.value)}
            placeholder="Cidade"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.uf}
            onChange={(event) => onUpdateField("uf", event.target.value)}
            placeholder="UF"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={profileForm.estado}
            onChange={(event) => onUpdateField("estado", event.target.value)}
            placeholder="Estado"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            type="password"
            value={profileForm.password}
            onChange={(event) => onUpdateField("password", event.target.value)}
            placeholder="Nova senha (opcional)"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
          <input
            type="password"
            value={profileForm.confirmPassword}
            onChange={(event) => onUpdateField("confirmPassword", event.target.value)}
            placeholder="Confirmar nova senha"
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
          />
        </div>

        {userRole === "professional" && (
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div>
              <p className="mb-1.5 text-xs text-slate-500">Foto profissional</p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  void onProfessionalPhotoUpload(event);
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
              {profileForm.professionalPhotoUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={profileForm.professionalPhotoUrl}
                    alt="Preview da foto profissional"
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateField("professionalPhotoUrl", "")}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remover foto
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={profileForm.professionalDescription}
              onChange={(event) => onUpdateField("professionalDescription", event.target.value)}
              placeholder="Descricao profissional / bio"
              rows={4}
              className="resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Localizacao do profissional</p>
                <button
                  type="button"
                  onClick={onUseCurrentProfessionalLocation}
                  disabled={professionalLocationLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {professionalLocationLoading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                  ) : (
                    <Navigation className="h-3.5 w-3.5" />
                  )}
                  {professionalLocationLoading ? "Detectando..." : "Usar localizacao atual"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={profileForm.professionalLatitude}
                  onChange={(event) => onUpdateField("professionalLatitude", event.target.value)}
                  placeholder="Latitude"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
                <input
                  value={profileForm.professionalLongitude}
                  onChange={(event) => onUpdateField("professionalLongitude", event.target.value)}
                  placeholder="Longitude"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => void onSaveProfile()}
          disabled={savingProfile}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
        >
          {savingProfile ? "Salvando..." : "Salvar perfil"}
        </button>

        {profileSuccess && (
          <p className="mt-3 text-sm text-green-600">Perfil atualizado com sucesso.</p>
        )}
        {profileError && (
          <p className="mt-2 text-sm text-red-600">{profileError}</p>
        )}
      </div>
    </div>
  );
}
