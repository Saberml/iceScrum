%{--
- Copyright (c) 2015 Kagilum.
-
- This file is part of iceScrum.
-
- iceScrum is free software: you can redistribute it and/or modify
- it under the terms of the GNU Affero General Public License as published by
- the Free Software Foundation, either version 3 of the License.
-
- iceScrum is distributed in the hope that it will be useful,
- but WITHOUT ANY WARRANTY; without even the implied warranty of
- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
- GNU General Public License for more details.
-
- You should have received a copy of the GNU Affero General Public License
- along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
-
- Authors:
-
- Vincent Barrier (vbarrier@kagilum.com)
- Nicolas Noullet (nnoullet@kagilum.com)
--}%
<script type="text/ng-template" id="feature.new.html">
<div class="card">
    <div class="details-header">
        <details-layout-buttons remove-ancestor="!$state.includes('feature.**')"/>
    </div>
    <div class="card-header">
        <div class="card-title">
            <div class="details-title">
                <span class="item-name" title="${message(code: 'todo.is.ui.feature.new')}">${message(code: 'todo.is.ui.feature.new')}</span>
            </div>
        </div>
        <div class="form-text">
            ${message(code: 'is.ui.feature.help')}
            <documentation doc-url="features-stories-tasks#features"/>
        </div>
        <div class="sticky-notes sticky-notes-standalone grid-group">
            <div class="sticky-note-container sticky-note-feature">
                <div sticky-note-color-watch="{{ feature.color }}"
                     class="sticky-note {{ feature.color | contrastColor }}">
                    <div class="sticky-note-head">
                        <span class="id">42</span>
                        <div class="sticky-note-type-icon"></div>
                    </div>
                    <div class="sticky-note-content">
                        <div class="item-values"></div>
                        <div class="title">{{ feature.name }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="details-no-tab">
        <form ng-submit="save(feature, false)"
              name='formHolder.featureForm'
              novalidate>
            <div class="card-body">
                <div class="form-group">
                    <label for="name">${message(code: 'is.feature.name')}</label>
                    <div class="input-group">
                        <input required
                               name="name"
                               autofocus
                               ng-model="feature.name"
                               autocomplete="off"
                               type="text"
                               class="form-control"
                               ng-disabled="!authorizedFeature('create')"
                               placeholder="${message(code: 'is.ui.feature.noname')}"/>
                        <span class="input-group-append">
                            <button colorpicker
                                    class="btn btn-sm btn-colorpicker {{ feature.color | contrastColor }}"
                                    type="button"
                                    ng-style="{'background-color': feature.color}"
                                    colorpicker-position="left"
                                    colorpicker-with-input="true"
                                    ng-click="refreshAvailableColors()"
                                    colors="availableColors"
                                    name="color"
                                    ng-model="feature.color">${message(code: 'todo.is.ui.color')}</button>
                        </span>
                    </div>
                </div>
                <entry:point id="feature-new-form"/>
            </div>
            <div class="card-footer" ng-if="authorizedFeature('create')">
                <div class="btn-toolbar">
                    <button class="btn btn-primary"
                            ng-disabled="formHolder.featureForm.$invalid || application.submitting"
                            defer-tooltip="${message(code: 'todo.is.ui.create.and.continue')} (SHIFT+RETURN)"
                            hotkey="{'shift+return': hotkeyClick }"
                            hotkey-allow-in="INPUT"
                            hotkey-description="${message(code: 'todo.is.ui.create.and.continue')}"
                            type='button'
                            ng-click="save(feature, true)">
                        ${message(code: 'todo.is.ui.create.and.continue')}
                    </button>
                    <button class="btn btn-primary"
                            ng-disabled="formHolder.featureForm.$invalid || application.submitting"
                            type="submit">
                        ${message(code: 'default.button.create.label')}
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>
</script>
