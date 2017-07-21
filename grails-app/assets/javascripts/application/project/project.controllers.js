/*
 * Copyright (c) 2015 Kagilum SAS.
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 *
 */
controllers.controller('dashboardCtrl', ['$scope', '$state', 'ProjectService', 'ReleaseService', 'SprintService', 'project', '$controller', function($scope, $state, ProjectService, ReleaseService, SprintService, project, $controller) {
    $scope.authorizedProject = function(action, project) {
        return ProjectService.authorizedProject(action, project);
    };
    $scope.authorizedRelease = function(action, release) {
        return ReleaseService.authorizedRelease(action, release);
    };
    $scope.authorizedSprint = function(action, sprint) {
        return SprintService.authorizedSprint(action, sprint);
    };
    $scope.openSprintUrl = function(sprint) {
        var stateName = 'planning.release.sprint.withId';
        if ($state.current.name != 'planning.release.sprint.withId.details') {
            stateName += '.details';
        }
        return $state.href(stateName, {sprintId: sprint.id, releaseId: sprint.parentRelease.id});
    };
    // Init
    $scope.release = {};
    $scope.allMembers = [];
    $scope.activities = [];
    $scope.currentOrLastSprint = {};
    $scope.currentOrNextSprint = {};
    $scope.projectMembersCount = 0;
    $scope.project = project;
    $controller('attachmentCtrl', {$scope: $scope, attachmentable: project, clazz: 'project'});
    ProjectService.getActivities($scope.project).then(function(activities) {
        $scope.activities = activities;
    });
    ReleaseService.getCurrentOrNextRelease($scope.project).then(function(release) {
        $scope.release = release;
        if (release && release.id) {
            SprintService.list(release);
        }
    });
    $scope.allMembers = _.unionBy($scope.project.team.members, $scope.project.productOwners, 'id');
    // Needs a separate call because it may not be in the currentOrNextRelease
    SprintService.getCurrentOrLastSprint($scope.project).then(function(sprint) {
        $scope.currentOrLastSprint = sprint;
    });
    SprintService.getLastSprint($scope.project).then(function(sprint) {
        $scope.lastSprint = sprint;
    });
    SprintService.getCurrentOrNextSprint($scope.project).then(function(sprint) {
        $scope.currentOrNextSprint = sprint;
    });
}]);

controllers.controller('abstractProjectListCtrl', ['$scope', 'ProjectService', 'ReleaseService', 'SprintService', 'TeamService', function($scope, ProjectService, ReleaseService, SprintService, TeamService) {
    $scope.selectProject = function(project) {
        $scope.project = project;
        $scope.projectMembersCount = ProjectService.countMembers(project);
        ReleaseService.getCurrentOrNextRelease(project).then(function(release) {
            if (release && release.id != undefined) {
                SprintService.list(release);
            }
            $scope.release = release;
        });
    };
    // Init
    $scope.release = {};
    $scope.project = {};
    $scope.projectMembersCount = 0;
}]);

controllers.controller('publicProjectListCtrl', ['$scope', '$controller', 'ProjectService', function($scope, $controller, ProjectService) {
    $controller('abstractProjectListCtrl', {$scope: $scope});
    // Init
    $scope.projects = [];
    $scope.openedProjects = {};
    $scope.$watch('openedProjects', function(newVal) { // Really ugly hack, only way to watch which accordion group is opened...
        var selectedProjectId = _.invert(newVal)[true];
        if (selectedProjectId != undefined) {
            var selectedProject = _.find($scope.projects, {id: parseInt(selectedProjectId)});
            $scope.selectProject(selectedProject);
        }
    }, true); // Be careful of circular objects, it will blow up the stack when comparing equality by value
    ProjectService.listPublic({paginate: true, count: 9}).then(function(projectsAndCount) {
        $scope.projects = projectsAndCount.projects;
    });
}]);

extensibleController('quickProjectsListCtrl', ['$scope', '$timeout', 'FormService', 'PushService', 'ProjectService', 'IceScrumEventType', function($scope, $timeout, FormService, PushService, ProjectService, IceScrumEventType) {
    $scope.getProjectUrl = function(project, viewName) {
        return $scope.serverUrl + '/p/' + project.pkey + '/' + (viewName ? "#/" + viewName : '');
    };
    $scope.createSampleProject = function() {
        return FormService.httpGet('project/createSample');
    };
    // Init
    $scope.projectsLoaded = false;
    $scope.projects = [];
    ProjectService.listByUser({paginate: true, count: 9, light: true}).then(function(projectsAndCount) {
        $scope.projectsLoaded = true;
        $scope.projects = projectsAndCount.projects;
    });
    PushService.registerScopedListener('user', IceScrumEventType.UPDATE, function(user) {
        if (user.updatedRole) {
            var updatedRole = user.updatedRole;
            var project = updatedRole.project;
            if (updatedRole.role == undefined) {
                _.remove($scope.projects, {id: project.id});
            } else if (updatedRole.oldRole == undefined && !_.includes($scope.projects, {id: project.id})) {
                $scope.projects.push(project);
            }
        }
    }, $scope);
}]);

controllers.controller('abstractProjectCtrl', ['$scope', '$filter', 'Session', 'UserService', function($scope, $filter, Session, UserService) {
    $scope.searchUsers = function(val, isPo) {
        return UserService.search(val, true).then(function(users) {
            return _.chain(users)
                .filter(function(u) {
                    var found = _.find($scope.project.productOwners, {email: u.email});
                    if (!found) {
                        found = _.find($scope.project.stakeHolders, {email: u.email});
                    }
                    if (!found && $scope.project.team) {
                        found = _.find($scope.project.team.members, {email: u.email});
                        if (isPo && found && found.scrumMaster) {
                            found = false;
                        }
                    }
                    return !found;
                })
                .map(function(member) {
                    member.name = $filter('userFullName')(member);
                    return member;
                })
                .value();
        });
    };
    $scope.addUser = function(user, role) {
        if (role == 'po') {
            $scope.project.productOwners.push(user);
            if ($scope.project.team) {
                var member = _.find($scope.project.team.members, {email: user.email});
                if (member) {
                    member.productOwner = true;
                }
            }
            $scope.po = {};
        } else if (role == 'sh') {
            $scope.project.stakeHolders.push(user);
            $scope.sh = {};
        }
    };
    $scope.removeUser = function(user, role) {
        if (role == 'po') {
            _.remove($scope.project.productOwners, {email: user.email});
            if ($scope.project.team) {
                var member = _.find($scope.project.team.members, {email: user.email});
                if (member) {
                    member.productOwner = false;
                }
            }
        } else if (role == 'sh') {
            _.remove($scope.project.stakeHolders, {email: user.email});
        }
    };
    $scope.prepareProject = function(project) {
        var p = angular.copy(project);
        var mapId = function(members) {
            return _.map(members, function(member) {
                return {id: member.id};
            });
        };
        p.team.scrumMasters = mapId(project.team.scrumMasters);
        p.team.members = _.filter(mapId(project.team.members), function(member) {
            return !_.some(p.team.scrumMasters, {id: member.id});
        });
        p.stakeHolders = mapId(project.stakeHolders);
        p.productOwners = mapId(project.productOwners);
        var invited = function(members) {
            return _.filter(members, function(member) {
                return !member.id
            });
        };
        p.team.invitedScrumMasters = invited(project.team.scrumMasters);
        p.team.invitedMembers = _.filter(invited(project.team.members), function(member) {
            return !_.some(p.team.invitedScrumMasters, {email: member.email});
        });
        p.invitedStakeHolders = invited(project.stakeHolders);
        p.invitedProductOwners = invited(project.productOwners);
        return p;
    };
    // Init
    $scope.po = {};
    $scope.sh = {};
    $scope.timezones = {};
    $scope.timezoneKeys = [];
    Session.getTimezones().then(function(timezones) {
        $scope.timezones = timezones;
        $scope.timezoneKeys = _.keys(timezones);
    });
}]);

extensibleController('newProjectCtrl', ['$scope', '$controller', 'DateService', 'UserTimeZone', 'WizardHandler', 'Project', 'ProjectService', 'Session', function($scope, $controller, DateService, UserTimeZone, WizardHandler, Project, ProjectService, Session) {
    $controller('abstractProjectCtrl', {$scope: $scope});
    $scope.type = 'newProject';
    $scope.checkProjectPropertyUrl = '/project/available';
    // Functions
    $scope.enableVisibilityChange = function() {
        return isSettings.projectPrivateEnabled || Session.admin();
    };
    $scope.isCurrentStep = function(index) {
        return WizardHandler.wizard().currentStepNumber() == index;
    };
    $scope.createProject = function(project) {
        var p = $scope.prepareProject(project);
        $scope.formHolder.creating = true;
        ProjectService.save(p).then(function(project) {
            $scope.openProject(project);
        }).catch(function() {
            $scope.formHolder.creating = false;
        });
    };
    $scope.teamMembersEditable = function(team) {
        return team.id == null;
    };
    $scope.teamCreatable = function() {
        return true;
    };
    $scope.teamRemovable = function() {
        return true;
    };
    $scope.projectMembersEditable = function() {
        return true;
    };
    $scope.teamManageable = function() {
        return false;
    };
    $scope.computePlanning = function() {
        $scope.totalDuration = DateService.daysBetweenDays($scope.project.firstSprint, $scope.project.endDate);
        if ($scope.project.preferences.estimatedSprintsDuration > $scope.totalDuration) {
            $scope.project.preferences.estimatedSprintsDuration = $scope.totalDuration;
        }
        var sprintDuration = $scope.project.preferences.estimatedSprintsDuration;
        var nbSprints = Math.floor($scope.totalDuration / sprintDuration);
        $scope.sprints = [];
        for (var i = 1; i <= nbSprints; i++) {
            var startDate = DateService.immutableAddDaysToDate($scope.project.firstSprint, (i - 1) * sprintDuration);
            var endDate = DateService.immutableAddDaysToDate(startDate, sprintDuration - 1);
            $scope.sprints.push({index: i, startDate: startDate, endDate: endDate});
        }
    };
    $scope.nameChanged = function() {
        var pkeyModel = $scope.formHolder.projectForm.pkey;
        if (!pkeyModel.$touched) {
            $scope.project.pkey = _.upperCase($scope.project.name).replace(/\W+/g, "").substring(0, 10);
            pkeyModel.$setDirty(); // To trigger remote validation
        }
    };
    // Init
    $scope.formHolder = {};
    $scope.project = new Project();
    var today = DateService.getMidnightTodayUTC();
    var endDate = DateService.immutableAddMonthsToDate(today, 3);
    angular.extend($scope.project, {
        startDate: today,
        firstSprint: today,
        endDate: endDate,
        planningPokerGameType: 1,
        preferences: {
            timezone: UserTimeZone.name(),
            noEstimation: false,
            estimatedSprintsDuration: 14,
            displayRecurrentTasks: true,
            displayUrgentTasks: true,
            hidden: isSettings.projectPrivateDefault && isSettings.projectPrivateEnabled
        },
        productOwners: [Session.user],
        stakeHolders: []
    });
    $scope.startDateOptions = {
        opened: false
    };
    $scope.firstSprintOptions = angular.copy($scope.startDateOptions);
    $scope.endDateOptions = angular.copy($scope.startDateOptions);
    $scope.$watchCollection('[project.startDate, project.endDate, project.firstSprint]', function(newValues) {
        var startDate = newValues[0];
        var endDate = newValues[1];
        var firstSprint = newValues[2];
        $scope.endDateOptions.minDate = DateService.immutableAddDaysToDate(firstSprint, 1);
        $scope.startDateOptions.maxDate = DateService.immutableAddDaysToDate(endDate, -1);
        $scope.firstSprintOptions.maxDate = $scope.startDateOptions.maxDate;
        $scope.firstSprintOptions.minDate = startDate;
    });
    $scope.totalDuration = 0;
    $scope.sprints = [];
    $scope.computePlanning();
}]);

controllers.controller('editProjectModalCtrl', ['$scope', 'Session', 'ProjectService', 'ReleaseService', 'AppService', function($scope, Session, ProjectService, ReleaseService, AppService) {
    $scope.type = 'editProject';
    $scope.enableVisibilityChange = function() {
        return true;
    };
    $scope.authorizedProject = function(action, project) {
        return ProjectService.authorizedProject(action, project);
    };
    $scope.setCurrentPanel = function(panel) {
        $scope.panel.current = panel;
    };
    $scope.getCurrentPanel = function() {
        return $scope.panel.current;
    };
    $scope.isCurrentPanel = function(panel) {
        return $scope.panel.current == panel;
    };
    // Mock steps of wizard
    $scope.isCurrentStep = function() {
        return true;
    };
    // Init
    $scope.currentProject = Session.getProject();
    $scope.checkProjectPropertyUrl = '/project/' + $scope.currentProject.id + '/available';
    ReleaseService.list($scope.currentProject).then(function(releases) {
        if (releases.length > 0) {
            $scope.startDateOptions.maxDate = new Date(releases[0].startDate);
        }
    });
    $scope.startDateOptions = {
        opened: false
    };
    if (!$scope.panel) {
        var defaultView = $scope.authorizedProject('update', $scope.currentProject) ? 'general' : 'actors';
        $scope.panel = {current: defaultView};
    }
    $scope.appsWithSettings = [];
    AppService.getAppDefinitionsWithProjectSettings($scope.currentProject).then(function(appsWithSettings) {
        $scope.appsWithSettings = appsWithSettings;
    });
}]);

controllers.controller('editProjectMembersCtrl', ['$scope', '$controller', 'Session', 'ProjectService', 'TeamService', function($scope, $controller, Session, ProjectService, TeamService) {
    $controller('abstractProjectCtrl', {$scope: $scope});
    $scope.teamMembersEditable = function() {
        return false;
    };
    $scope.teamCreatable = function() {
        return false;
    };
    $scope.teamRemovable = function() {
        return TeamService.authorizedTeam('updateMembers');
    };
    $scope.projectMembersEditable = function(project) {
        return ProjectService.authorizedProject('updateProjectMembers', project);
    };
    $scope.teamManageable = function(team) {
        return team.selected && TeamService.authorizedTeam('updateMembers');
    };
    $scope.invitationToUserMock = function(invitation) {
        return {email: invitation.email};
    };
    $scope.resetTeamForm = function() {
        $scope.resetFormValidation($scope.formHolder.editMembersForm);
        $scope.project = angular.copy($scope.currentProject);
        $scope.project.stakeHolders = $scope.project.stakeHolders.concat(_.map($scope.project.invitedStakeHolders, $scope.invitationToUserMock));
        $scope.project.productOwners = $scope.project.productOwners.concat(_.map($scope.project.invitedProductOwners, $scope.invitationToUserMock));
    };
    $scope.updateProjectTeam = function(project) {
        var p = $scope.prepareProject(project);
        ProjectService.updateTeam(p)
            .then(function(updatedProject) {
                Session.updateProject(updatedProject);
                $scope.resetTeamForm();
                $scope.notifySuccess('todo.is.ui.project.members.updated');
            });
    };
    $scope.leaveTeam = function(project) {
        ProjectService.leaveTeam(project).then(function() {
            document.location.reload(true);
        });
    };
    $scope.manageTeam = function(team) {
        $scope.$close(true);
        $scope.showManageTeamsModal(team);
    };
    // Init
    $scope.formHolder = {};
    $scope.resetTeamForm();
}]);

controllers.controller('editProjectCtrl', ['$scope', 'Session', 'ProjectService', function($scope, Session, ProjectService) {
    $scope.stakeHolderViews = [];
    $scope.update = function(project) {
        $scope.project.preferences.stakeHolderRestrictedViews = _.chain($scope.stakeHolderViews).filter({hidden: true}).map('id').value().join(',');
        ProjectService.update(project)
            .then(function(updatedProject) {
                Session.updateProject(updatedProject);
                $scope.notifySuccess('todo.is.ui.project.general.updated');
                $scope.resetProjectForm();
            });
    };
    $scope.resetProjectForm = function() {
        $scope.resetFormValidation($scope.formHolder.editProjectForm);
        $scope.project = angular.copy($scope.currentProject);
        var restrictedViews = $scope.project.preferences.stakeHolderRestrictedViews ? $scope.project.preferences.stakeHolderRestrictedViews.split(',') : [];
        $scope.stakeHolderViews = _.chain(isSettings.projectMenus).map(function(menu) {
            return {title: menu.title, id: menu.id, hidden: _.includes(restrictedViews, menu.id)};
        }).sortBy('title').value();
    };
    $scope['delete'] = function(project) {
        $scope.confirm({
            message: $scope.message('todo.is.ui.projectmenu.submenu.project.delete.confirm'),
            callback: function() {
                ProjectService.delete(project).then(function() {
                    document.location = $scope.serverUrl;
                });
            }
        })
    };
    $scope.archive = function(project) {
        $scope.confirm({
            message: $scope.message('is.dialog.project.archive.confirm'),
            callback: function() {
                ProjectService.archive(project).then(function() {
                    document.location = $scope.serverUrl;
                });
            }
        })
    };
    // Init
    $scope.formHolder = {};
    $scope.resetProjectForm();
    $scope.timezones = {};
    $scope.timezoneKeys = [];
    Session.getTimezones().then(function(timezones) {
        $scope.timezones = timezones;
        $scope.timezoneKeys = _.keys(timezones);
    });
}]);
