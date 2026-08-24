require 'xcodeproj'

project_path = File.join(__dir__, 'Moondial.xcodeproj')
project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |t| t.name == 'Moondial' }
raise 'Moondial target not found' unless target

# A group whose on-disk path is Moondial/Sounds (relative to the project dir).
sounds_group = project.main_group['Sounds'] || project.main_group.new_group('Sounds', 'Moondial/Sounds')

added = []
Dir[File.join(__dir__, 'Moondial', 'Sounds', '*.wav')].sort.each do |abs|
  base = File.basename(abs)
  next if sounds_group.files.any? { |fr| fr.display_name == base }
  ref = sounds_group.new_reference(abs)
  target.add_resources([ref])
  added << base
end

project.save
puts "added to Moondial resources: #{added.empty? ? '(none, already present)' : added.join(', ')}"
