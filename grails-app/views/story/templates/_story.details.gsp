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
<script type="text/ng-template" id="story.details.html">
<div class="panel panel-light">
    <div id="story-header" class="panel-heading">
            <h3 class="panel-title row">
                <div class="left-title">
                    <a href
                       uib-tooltip="{{ story.followers_count }} ${message(code: 'todo.is.ui.followers')}"
                       tooltip-append-to-body="true"
                       ng-click="follow(story)"
                       ng-switch="story.followed"><i class="fa fa-star-o" ng-switch-default></i><i class="fa fa-star" ng-switch-when="true"></i></a>
                    <span>{{ story.name }}</span> <small ng-show="story.origin">${message(code: 'is.story.origin')}: {{ story.origin }}</small>
                </div>
                <div class="right-title">
                    <span uib-tooltip="${message(code: 'is.story.creator')} : {{ story.creator | userFullName }}"
                          tooltip-append-to-body="true">
                        <img ng-src="{{ story.creator | userAvatar }}" alt="{{ story.creator | userFullName }}"
                             height="30px"/>
                    </span>
                    <button class="btn btn-default elemid"
                            uib-tooltip="${message(code: 'is.permalink')}"
                            tooltip-append-to-body="true"
                            ng-click="showCopyModal('${message(code:'is.permalink')}', story.uid)">{{ story.uid }}</button>
                    <button class="btn btn-default"
                            type="button"
                            ng-click="like(story)"
                            ng-switch="story.liked"
                            role="button"
                            tabindex="0"
                            uib-tooltip="{{ story.likers_count }} ${message(code: 'todo.is.ui.likers')}"
                            tooltip-append-to-body="true">
                        <i class="fa fa-thumbs-o-up" ng-switch-default></i>
                        <i class="fa fa-thumbs-up" ng-switch-when="true"></i>
                        <span class="badge" ng-show="story.likers_count">{{ story.likers_count }}</span>
                    </button>
                    <div class="btn-group"
                         uib-dropdown
                         uib-tooltip="${message(code: 'todo.is.ui.actions')}"
                         tooltip-append-to-body="true">
                        <button type="button" class="btn btn-default" uib-dropdown-toggle>
                            <span class="fa fa-cog"></span> <span class="caret"></span>
                        </button>
                        <ul class="uib-dropdown-menu" ng-include="'story.menu.html'"></ul>
                    </div>
                    <a ng-if="previous"
                       class="btn btn-default"
                       role="button"
                       tabindex="0"
                       href="#backlog/{{ previous.id }}"><i class="fa fa-caret-left" title="${message(code:'is.ui.backlogelement.toolbar.previous')}"></i></a>
                    <a ng-if="next"
                       class="btn btn-default"
                       role="button"
                       tabindex="0"
                       href="#backlog/{{ next.id }}"><i class="fa fa-caret-right" title="${message(code:'is.ui.backlogelement.toolbar.next')}"></i></a>
                </div>
            </h3>
        <div class="progress-container">
            <div class="progress">
                <div ng-repeat="progressState in progressStates"
                     class="progress-bar progress-bar-{{ progressState.code }}"
                     tooltip-placement="left"
                     tooltip-append-to-body="true"
                     uib-tooltip="{{ progressState.name }}" style="width:{{ progressState.width }}%">
                    {{ progressState.days }}
                </div>
            </div>
        </div>
    </div>
    <ul class="nav nav-tabs nav-justified">
        <li role="presentation" ng-class="{'active':!$state.params.tabId}">
            <a href="#backlog/{{ story.id }}"
               href="#"><i class="fa fa-lg fa-edit"></i></a>
        </li>
        <li role="presentation" ng-class="{'active':$state.params.tabId == 'activities'}">
            <a href="#backlog/{{ story.id }}/activities"
               uib-tooltip="{{ story.activities && story.activities.length ? message('is.fluxiable.' + story.activities[0].code) : '' }}"
               tooltip-append-to-body="true"
               href="#"><i class="fa fa-lg fa-clock-o"></i></a>
        </li>
        <li role="presentation" ng-class="{'active':$state.params.tabId == 'comments'}">
            <a href="#backlog/{{ story.id }}/comments"
               uib-tooltip="{{ story.comments.length | orElse: 0 }} ${message(code:'todo.is.ui.comments.count')}"
               tooltip-append-to-body="true"
               ng-switch="story.comments_count">
                <i class="fa fa-lg fa-comment-o" ng-switch-when="0"></i>
                <i class="fa fa-lg fa-comment" ng-switch-default></i>
                <span class="badge" ng-show="story.comments_count">{{ story.comments_count }}</span>
            </a>
        </li>
        <li role="presentation" ng-class="{'active':$state.params.tabId == 'tasks'}">
            <a href="#backlog/{{ story.id }}/tasks"
               uib-tooltip="{{ story.tasks_count | orElse: 0 }} ${message(code:'todo.is.ui.tasks.count')}"
               tooltip-append-to-body="true"
               ng-switch="story.comments_count">
                <i class="fa fa-lg fa-tasks"></i>
                <span class="badge" ng-show="story.tasks_count">{{ story.tasks_count }}</span>
            </a>
        </li>
        <li role="presentation" ng-class="{'active':$state.params.tabId == 'tests'}">
            <a href="#backlog/{{ story.id }}/tests"
               uib-tooltip="{{ story.acceptanceTests_count | orElse: 0 }} ${message(code:'todo.is.ui.acceptanceTests.count')}"
               tooltip-append-to-body="true"
               ng-switch="story.acceptanceTests_count">
                <i class="fa fa-lg fa-check-square-o" ng-switch-when="0"></i>
                <i class="fa fa-lg fa-check-square" ng-switch-default></i>
                <span class="badge" ng-if="story.acceptanceTests_count">{{ story.acceptanceTests_count }}</span>
            </a>
        </li>
    </ul>
    <div ui-view="details-tab">
        <g:include view="story/templates/_story.properties.gsp"/>
    </div>
</div>
</script>